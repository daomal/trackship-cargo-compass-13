
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Truck, LogIn, UserPlus, Sparkles, Shield, Zap } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, profile, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    name: ''
  });

  useEffect(() => {
    if (user && profile) {
      // Redirect based on user role and driver status
      if (profile.driver_id) {
        // User is a driver, redirect to driver dashboard
        navigate('/dashboard-supir');
      } else if (profile.role === 'admin') {
        // User is admin, redirect to main dashboard
        navigate('/');
      } else {
        // Regular user, redirect to main dashboard
        navigate('/');
      }
    }
  }, [user, profile, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError('');
    setSuccess('');

    const { error } = await signIn(signInData.email, signInData.password);

    if (error) {
      setError(error.message || 'Gagal login. Periksa email dan password Anda.');
    } else {
      setSuccess('Login berhasil! Mengalihkan...');
    }

    setIsSigningIn(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    setError('');
    setSuccess('');

    const { error } = await signUp(signUpData.email, signUpData.password, signUpData.name);

    if (error) {
      setError(error.message || 'Gagal mendaftar. Silakan coba lagi.');
    } else {
      setSuccess('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
    }

    setIsSigningUp(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-16 w-16 border-4 border-blue-400 rounded-full border-t-transparent mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-2xl">
              <Truck className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            DeliveryPro
          </h1>
          <p className="text-slate-300 text-lg">Sistem Pengiriman Terdepan</p>
          
          {/* Feature badges */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-blue-200">
              <Sparkles className="h-3 w-3" />
              Real-time
            </div>
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-indigo-200">
              <Shield className="h-3 w-3" />
              Secure
            </div>
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-purple-200">
              <Zap className="h-3 w-3" />
              Fast
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-white">Selamat Datang</CardTitle>
            <CardDescription className="text-slate-300">
              Akses dashboard pengiriman premium Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-white/10">
                <TabsTrigger 
                  value="signin" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200 text-slate-300"
                >
                  <LogIn className="h-4 w-4" />
                  Masuk
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="flex items-center gap-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-200 text-slate-300"
                >
                  <UserPlus className="h-4 w-4" />
                  Daftar
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500/50 bg-green-500/10 backdrop-blur-sm">
                  <AlertDescription className="text-green-200">{success}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-slate-200">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-slate-200">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Masukkan password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({
                        ...prev,
                        password: e.target.value
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12"
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                        Memproses...
                      </div>
                    ) : (
                      'Masuk'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-slate-200">Nama Lengkap</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-indigo-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-200">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-indigo-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-200">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({
                        ...prev,
                        password: e.target.value
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-indigo-400"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12"
                    disabled={isSigningUp}
                  >
                    {isSigningUp ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                        Memproses...
                      </div>
                    ) : (
                      'Daftar'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-slate-400">
          <p className="text-sm">Sistem Manajemen Pengiriman Premium</p>
          <p className="text-xs mt-1 opacity-75">Untuk supir dan admin profesional</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
