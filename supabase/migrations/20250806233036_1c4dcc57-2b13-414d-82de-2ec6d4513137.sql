-- Update jgarzher@gmail.com to have admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'jgarzher@gmail.com';