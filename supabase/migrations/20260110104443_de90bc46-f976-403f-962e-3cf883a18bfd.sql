-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'center_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Centers table (create BEFORE profiles to allow foreign key)
CREATE TABLE public.centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    email TEXT,
    phone TEXT,
    contact_person TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- Profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Function to get user's center_id (NOW profiles exists)
CREATE OR REPLACE FUNCTION public.get_user_center_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT center_id FROM public.profiles WHERE id = _user_id
$$;

-- Courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL DEFAULT 12,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Enquiries table (CRM for centers)
CREATE TABLE public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id),
    source TEXT DEFAULT 'walk-in' CHECK (source IN ('walk-in', 'phone', 'website', 'referral', 'social-media', 'other')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'converted', 'lost')),
    notes TEXT,
    follow_up_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_no TEXT UNIQUE NOT NULL,
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fee_paid DECIMAL(10,2) DEFAULT 0,
    fee_pending DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'on-hold')),
    enquiry_id UUID REFERENCES public.enquiries(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Stock items (materials that can be ordered)
CREATE TABLE public.stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'material' CHECK (category IN ('material', 'certificate', 'id-card', 'uniform', 'other')),
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- Center stock inventory
CREATE TABLE public.center_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (center_id, stock_item_id)
);

ALTER TABLE public.center_stock ENABLE ROW LEVEL SECURITY;

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT UNIQUE NOT NULL,
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order items
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_centers_updated_at BEFORE UPDATE ON public.centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_enquiries_updated_at BEFORE UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- User roles: Users can view their own roles, admins can manage all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Profiles: Users can view/update own profile, admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage all profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Centers: Super admins can manage, center admins can view their own
CREATE POLICY "Super admins can manage centers" ON public.centers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Center admins can view own center" ON public.centers FOR SELECT USING (id = public.get_user_center_id(auth.uid()));

-- Courses: Super admins can manage, all authenticated can view
CREATE POLICY "Super admins can manage courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Authenticated users can view courses" ON public.courses FOR SELECT TO authenticated USING (true);

-- Enquiries: Super admins can view all, center admins can manage their center's enquiries
CREATE POLICY "Super admins can view all enquiries" ON public.enquiries FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Center admins can manage own enquiries" ON public.enquiries FOR ALL USING (center_id = public.get_user_center_id(auth.uid()));

-- Students: Super admins can view all, center admins can manage their center's students
CREATE POLICY "Super admins can view all students" ON public.students FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Center admins can manage own students" ON public.students FOR ALL USING (center_id = public.get_user_center_id(auth.uid()));

-- Stock items: Super admins can manage, all authenticated can view
CREATE POLICY "Super admins can manage stock items" ON public.stock_items FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Authenticated users can view stock items" ON public.stock_items FOR SELECT TO authenticated USING (true);

-- Center stock: Super admins can view all, center admins can view/manage their own
CREATE POLICY "Super admins can manage all center stock" ON public.center_stock FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Center admins can manage own stock" ON public.center_stock FOR ALL USING (center_id = public.get_user_center_id(auth.uid()));

-- Orders: Super admins can manage all, center admins can manage their own
CREATE POLICY "Super admins can manage all orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Center admins can manage own orders" ON public.orders FOR ALL USING (center_id = public.get_user_center_id(auth.uid()));

-- Order items: Follow parent order permissions
CREATE POLICY "Super admins can manage all order items" ON public.order_items FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Center admins can manage own order items" ON public.order_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.center_id = public.get_user_center_id(auth.uid())
    )
);

-- Generate enrollment number function
CREATE OR REPLACE FUNCTION public.generate_enrollment_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_suffix TEXT;
    next_num INTEGER;
    result TEXT;
BEGIN
    year_suffix := to_char(CURRENT_DATE, 'YY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(enrollment_no FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.students
    WHERE enrollment_no LIKE 'PBS' || year_suffix || '%';
    result := 'PBS' || year_suffix || LPAD(next_num::TEXT, 5, '0');
    RETURN result;
END;
$$;

-- Generate order number function
CREATE OR REPLACE FUNCTION public.generate_order_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_suffix TEXT;
    next_num INTEGER;
    result TEXT;
BEGIN
    year_suffix := to_char(CURRENT_DATE, 'YY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_no FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.orders
    WHERE order_no LIKE 'ORD' || year_suffix || '%';
    result := 'ORD' || year_suffix || LPAD(next_num::TEXT, 5, '0');
    RETURN result;
END;
$$;