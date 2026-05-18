import { Link } from 'react-router-dom';
import { CheckCircle, MapPin, Clock, Users, TrendingUp, BookOpen, ArrowRight, Star } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: MapPin,
      title: 'Smart Seat Selection',
      description: 'Browse and book your favorite study seats with real-time availability across multiple shifts.',
    },
    {
      icon: Clock,
      title: 'Flexible Shift Booking',
      description: 'Choose from Morning, Evening, Night, or Full-day shifts based on your study preferences.',
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      description: 'Track occupancy trends and make informed decisions about peak study hours.',
    },
    {
      icon: Users,
      title: 'Community Features',
      description: 'Connect with fellow students and build a productive study community.',
    },
    {
      icon: BookOpen,
      title: 'Resource Management',
      description: 'Manage study materials and access library resources directly from your dashboard.',
    },
    {
      icon: TrendingUp,
      title: 'Payment Management',
      description: 'Secure payments, invoices, and flexible subscription options for your convenience.',
    },
  ];

  const stats = [
    { number: '1000+', label: 'Active Users' },
    { number: '500+', label: 'Study Seats' },
    { number: '4.8/5', label: 'User Rating' },
    { number: '99.9%', label: 'Uptime' },
  ];

  const testimonials = [
    {
      name: 'Riya Sharma',
      role: 'Student',
      message: 'SpaceShift made finding study spaces so easy. I book my seat every morning!',
      avatar: 'R',
    },
    {
      name: 'Arjun Kumar',
      role: 'Regular User',
      message: 'The flexible shifts are perfect for my schedule. Highly recommended!',
      avatar: 'A',
    },
    {
      name: 'Priya Patel',
      role: 'Library Manager',
      message: 'Managing occupancy and bookings has never been easier with SpaceShift.',
      avatar: 'P',
    },
  ];

  return (
    <div className="w-full bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="10" width="14" height="20" fill="none" stroke="#000000" strokeWidth="1.5" rx="1"/>
              <rect x="22" y="10" width="14" height="20" fill="none" stroke="#000000" strokeWidth="1.5" rx="1"/>
              <line x1="22" y1="10" x2="22" y2="30" stroke="#000000" strokeWidth="1.5"/>
              <line x1="11" y1="14" x2="19" y2="14" stroke="#000000" strokeWidth="1"/>
              <line x1="11" y1="17" x2="19" y2="17" stroke="#000000" strokeWidth="1"/>
              <line x1="11" y1="20" x2="19" y2="20" stroke="#000000" strokeWidth="1"/>
              <line x1="11" y1="23" x2="17" y2="23" stroke="#000000" strokeWidth="1"/>
              <path d="M 28 19 L 34 25 M 34 25 L 28 31 M 34 25 L 36 25" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="36" r="2" fill="#000000"/>
              <circle cx="24" cy="36" r="2" fill="#000000"/>
              <circle cx="30" cy="36" r="2" fill="#000000" opacity="0.5"/>
            </svg>
            <span className="font-display text-xl font-bold text-black">SpaceShift</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Smart Study Space Management
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Book your perfect study seat, manage your schedule, and boost your productivity with SpaceShift—the platform designed for modern learners.
            </p>
            <div className="flex gap-4">
              <Link to="/register" className="btn-primary flex items-center gap-2">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="btn-secondary">Watch Demo</button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <svg className="w-32 h-32 mx-auto mb-4 text-gray-400" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="10" width="14" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1"/>
                <rect x="22" y="10" width="14" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1"/>
                <line x1="22" y1="10" x2="22" y2="30" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="11" y1="14" x2="19" y2="14" stroke="currentColor" strokeWidth="1"/>
                <line x1="11" y1="17" x2="19" y2="17" stroke="currentColor" strokeWidth="1"/>
                <line x1="11" y1="20" x2="19" y2="20" stroke="currentColor" strokeWidth="1"/>
                <line x1="11" y1="23" x2="17" y2="23" stroke="currentColor" strokeWidth="1"/>
                <path d="M 28 19 L 34 25 M 34 25 L 28 31 M 34 25 L 36 25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-gray-500">Book seats, manage shifts, grow together</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-4xl font-bold text-gray-900 mb-2">{stat.number}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage study spaces efficiently and keep students engaged.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="card group hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-900 transition-colors">
                <feature.icon className="w-6 h-6 text-gray-900 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-medium text-lg text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description: 'Create your account in seconds and complete your profile.',
              },
              {
                step: '2',
                title: 'Browse & Book',
                description: 'View available seats and book your preferred study space.',
              },
              {
                step: '3',
                title: 'Study & Grow',
                description: 'Enjoy a productive environment and track your progress.',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="card">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-display font-bold text-lg mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-medium text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Loved by Students & Managers</h2>
          <p className="text-xl text-gray-600">See what our users have to say</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-gray-900 text-gray-900" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">{testimonial.message}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-600">Choose a plan that works for you</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '₹999',
                period: '/month',
                features: ['5 seat bookings', 'Basic analytics', 'Email support'],
              },
              {
                name: 'Pro',
                price: '₹1,999',
                period: '/month',
                features: ['Unlimited bookings', 'Advanced analytics', 'Priority support', 'Custom schedules'],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'pricing',
                features: ['Everything in Pro', 'Dedicated manager', 'API access', 'Custom integrations'],
              },
            ].map((plan, i) => (
              <div key={i} className={`card ${plan.popular ? 'ring-2 ring-gray-900 relative' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold text-gray-900 mb-1">{plan.price}</p>
                <p className="text-sm text-gray-600 mb-6">{plan.period}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-gray-900" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl font-bold mb-4">Ready to Transform Your Study Experience?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of students already using SpaceShift to boost their productivity.</p>
          <Link to="/register" className="btn-primary bg-white text-gray-900 hover:bg-gray-100">
            Start Your Free Trial Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="10" width="14" height="20" fill="none" stroke="#000000" strokeWidth="1.5" rx="1"/>
                  <rect x="22" y="10" width="14" height="20" fill="none" stroke="#000000" strokeWidth="1.5" rx="1"/>
                  <line x1="22" y1="10" x2="22" y2="30" stroke="#000000" strokeWidth="1.5"/>
                </svg>
                <span className="font-display font-bold text-gray-900">SpaceShift</span>
              </div>
              <p className="text-sm text-gray-600">Smart study space management for modern learners.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Features</a></li>
                <li><a href="#" className="hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 text-center">© 2024 SpaceShift. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
