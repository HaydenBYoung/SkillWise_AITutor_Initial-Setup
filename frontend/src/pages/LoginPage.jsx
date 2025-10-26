const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-blue-600">SkillWise</h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to your learning journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                New to SkillWise?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
          <div className="space-y-4">
            <blockquote className="text-lg text-gray-700 italic">
              "SkillWise transformed how I learn. The AI feedback is incredibly
              helpful!"
            </blockquote>
            <cite className="text-sm text-gray-600 flex items-center space-x-3">
              <img
                src="https://ui-avatars.com/api/?name=Sarah+K&background=0366D6&color=fff"
                alt="Sarah K."
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-medium text-gray-900">Sarah K.</div>
                <div className="text-gray-600">Software Developer</div>
              </div>
            </cite>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
