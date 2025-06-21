import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Truck, LogIn, UserPlus } from 'lucide-react';

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
      if (profile.driver_id) {
        navigate('/dashboard-supir');
      } else if (profile.role === 'admin') {
        navigate('/');
      } else {
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
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-in">
          <div className="flex items-center justify-center mb-6">
            <div className="glass-card p-4 rounded-full">
              <Truck className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Sistem Pengiriman</h1>
          <p className="text-slate-600">Masuk atau daftar untuk melanjutkan</p>
        </div>

        <Card className="shadow-2xl border-white/50 hover-lift">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-slate-800">Selamat Datang</CardTitle>
            <CardDescription className="text-slate-600">
              Akses dashboard pengiriman Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 glass-card p-1">
                <TabsTrigger value="signin" className="flex items-center gap-2 data-[state=active]:bg-white/70 data-[state=active]:shadow-md rounded-lg transition-all duration-300">
                  <LogIn className="h-4 w-4" />
                  Masuk
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2 data-[state=active]:bg-white/70 data-[state=active]:shadow-md rounded-lg transition-all duration-300">
                  <UserPlus className="h-4 w-4" />
                  Daftar
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="glass-card border-red-200/50 bg-red-50/70">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="glass-card border-green-200/50 bg-green-50/70">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-slate-700 font-medium">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-slate-700 font-medium">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Masukkan password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({
                        ...prev,
                        password: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? 'Memproses...' : 'Masuk'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-slate-700 font-medium">Nama Lengkap</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-700 font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-700 font-medium">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({
                        ...prev,
                        password: e.target.value
                      }))}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSigningUp}
                  >
                    {isSigningUp ? 'Memproses...' : 'Daftar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-slate-600 animate-fade-in" style={{animationDelay: "0.3s"}}>
          <p className="glass-card px-4 py-2 inline-block">Sistem Manajemen Pengiriman</p>
          <p className="mt-2 opacity-75">Untuk supir dan admin</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
