
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Activity, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            API Performance Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Monitor, analyze, and optimize your API performance with real-time insights, 
            detailed analytics, and comprehensive reporting.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="text-lg px-8 py-3">
              <BarChart3 className="mr-2 h-5 w-5" />
              View Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-blue-800">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-blue-700">
                Track response times, throughput, and success rates across all your APIs
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="text-center">
              <Activity className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-green-800">Real-time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-green-700">
                Live dashboard with automatic updates and instant alerts for issues
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-amber-600 mx-auto mb-2" />
              <CardTitle className="text-amber-800">Historical Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-amber-700">
                Analyze trends over time with detailed logs and performance history
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />
              <CardTitle className="text-red-800">Error Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-red-700">
                Identify and track API failures with detailed error analysis
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-gray-50 to-gray-100">
            <CardHeader>
              <CardTitle className="text-2xl">Dashboard Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Analytics & Reports</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Average response times by API</li>
                    <li>• Success and error rate tracking</li>
                    <li>• Slowest API call identification</li>
                    <li>• Time-based performance trends</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Filtering & Sorting</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Filter by API name and status codes</li>
                    <li>• Sort by response time and timestamp</li>
                    <li>• Search through request details</li>
                    <li>• Daily, weekly, and all-time views</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
