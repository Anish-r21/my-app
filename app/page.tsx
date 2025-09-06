import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Award, ArrowRight, GraduationCap, TrendingUp, Shield, Clock, Sparkles } from "lucide-react"

export default function LandingPage() {
  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Interactive Courses",
      description: "Engaging video content with hands-on exercises and practical assignments.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics and completion rates.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Expert Instructors",
      description: "Learn from industry professionals with years of real-world experience.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Platform",
      description: "Your data and progress are protected with enterprise-grade security.",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Learn at Your Pace",
      description: "Access content 24/7 and progress through courses at your own speed.",
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Get Certified",
      description: "Earn certificates upon completion to showcase your new skills.",
    },
  ]

  const stats = [
    { number: "10,000+", label: "Students Enrolled" },
    { number: "150+", label: "Expert Instructors" },
    { number: "50+", label: "Course Categories" },
    { number: "95%", label: "Completion Rate" },
  ]

  return (
    <div className="min-h-screen w-full font-inter">
      {/* Hero Section */}
      <div className="relative min-h-screen bg-[#F8F5F2]">
        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#4A7C59] rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[#333333]">
                LearnHub
              </span>
            </div>
            <div className="flex space-x-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="nav-btn-outline"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="btn-primary">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-6 pt-12 pb-32 md:pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-[#E0F0E5] text-[#4A7C59] border-[#D4EADF] px-4 py-2 text-sm font-semibold">
              Trusted by 10,000+ Students
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-[#333333] leading-tight">
              Learn Skills That
              <span className="block text-[#4A7C59] mt-2">Matter Today</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Access high-quality courses, track your progress, and earn certificates
              from industry experts. Start your learning journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="btn-primary"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Learning Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                size="lg"
                className="btn-secondary"
              >
                Browse Courses
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/70 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-[#4A7C59] mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#4A7C59]/10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[#333333]">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools and resources you need to master new skills.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4A7C59] to-[#D4A276] rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <CardTitle className="text-lg text-[#333333] group-hover:text-[#4A7C59] transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors duration-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#D4A276] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of students who have already started their learning journey with us.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-[#D4A276] hover:bg-[#F8F5F2] px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#333333] py-12 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-[#4A7C59] rounded-xl flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">
                LearnHub
              </span>
            </div>
            <p className="text-gray-400 text-center md:text-right text-sm">
              © 2024 LearnHub. Empowering learners worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
