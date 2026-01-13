-- Create tutorials table for course materials
CREATE TABLE public.tutorials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE public.support_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_ticket_replies table
CREATE TABLE public.support_ticket_replies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL DEFAULT 'center', -- 'center' or 'admin'
    sender_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create center_courses authorization table (which courses a center can offer)
CREATE TABLE public.center_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    commission_percent NUMERIC DEFAULT 0,
    kit_value NUMERIC DEFAULT 0,
    exam_value NUMERIC DEFAULT 0,
    duration_override INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(center_id, course_id)
);

-- Create coordinators table
CREATE TABLE public.coordinators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    region TEXT,
    assigned_centers UUID[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app_settings table for global settings
CREATE TABLE public.app_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'general',
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutorials
CREATE POLICY "Authenticated users can view tutorials"
ON public.tutorials FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage tutorials"
ON public.tutorials FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for support_tickets
CREATE POLICY "Center admins can manage own tickets"
ON public.support_tickets FOR ALL
USING (center_id = get_user_center_id(auth.uid()));

CREATE POLICY "Super admins can manage all tickets"
ON public.support_tickets FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for support_ticket_replies
CREATE POLICY "Center admins can view own ticket replies"
ON public.support_ticket_replies FOR SELECT
USING (EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = support_ticket_replies.ticket_id 
    AND support_tickets.center_id = get_user_center_id(auth.uid())
));

CREATE POLICY "Center admins can create replies on own tickets"
ON public.support_ticket_replies FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = support_ticket_replies.ticket_id 
    AND support_tickets.center_id = get_user_center_id(auth.uid())
));

CREATE POLICY "Super admins can manage all replies"
ON public.support_ticket_replies FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for center_courses
CREATE POLICY "Center admins can view own authorizations"
ON public.center_courses FOR SELECT
USING (center_id = get_user_center_id(auth.uid()));

CREATE POLICY "Super admins can manage all authorizations"
ON public.center_courses FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for coordinators
CREATE POLICY "Super admins can manage coordinators"
ON public.coordinators FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Center admins can view coordinators"
ON public.coordinators FOR SELECT
USING (true);

-- RLS Policies for app_settings
CREATE POLICY "Authenticated users can view settings"
ON public.app_settings FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage settings"
ON public.app_settings FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_tutorials_updated_at
BEFORE UPDATE ON public.tutorials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_center_courses_updated_at
BEFORE UPDATE ON public.center_courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coordinators_updated_at
BEFORE UPDATE ON public.coordinators
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();