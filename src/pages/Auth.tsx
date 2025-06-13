
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
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Truck className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Sistem Pengiriman</h1>
          <p className="text-gray-600 mt-2">Masuk atau daftar untuk melanjutkan</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Selamat Datang</CardTitle>
            <CardDescription className="text-center">
              Akses dashboard pengiriman Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Masuk
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Daftar
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
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
                    <Label htmlFor="signin-password">Password</Label>
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
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? 'Memproses...' : 'Masuk'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nama Lengkap</Label>
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
                    <Label htmlFor="signup-email">Email</Label>
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
                    <Label htmlFor="signup-password">Password</Label>
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
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isSigningUp}
                  >
                    {isSigningUp ? 'Memproses...' : 'Daftar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Sistem Manajemen Pengiriman</p>
          <p className="mt-1">Untuk supir dan admin</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
