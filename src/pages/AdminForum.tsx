
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, MessageSquare, Users, Clock, Image } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

interface KendalaReport {
  id: string;
  created_at: string;
  author_name: string;
  message: string;
  photo_url?: string | null;
  user_id?: string | null;
  shipment_id: string;
  shipments?: {
    no_surat_jalan: string;
    tujuan: string;
    perusahaan: string;
  } | null;
}

const AdminForum = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const [reports, setReports] = useState<KendalaReport[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyImage, setReplyImage] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    fetchAllReports();
    subscribeToReports();
  }, [isAdmin]);

  const fetchAllReports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('kendala_reports')
        .select(`
          *,
          shipments (
            no_surat_jalan,
            tujuan,
            perusahaan
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        toast.error('Gagal memuat laporan kendala');
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToReports = () => {
    const channel = supabase
      .channel('admin_kendala_reports')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kendala_reports'
      }, () => {
        fetchAllReports();
        toast.success('Ada laporan baru dari driver!');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendReply = async (shipmentId: string) => {
    if (!replyMessage.trim() && !replyImage) {
      toast.error('Pesan tidak boleh kosong');
      return;
    }

    if (!user) {
      toast.error('Anda harus login untuk mengirim balasan');
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase
        .from('kendala_reports')
        .insert({
          shipment_id: shipmentId,
          user_id: user.id,
          author_name: `${profile?.name || 'Admin'} (Admin)`,
          message: replyMessage.trim() || 'Foto terlampir',
          photo_url: replyImage || null
        });

      if (error) {
        console.error('Error sending reply:', error);
        toast.error('Gagal mengirim balasan');
        return;
      }

      setReplyMessage('');
      setReplyImage('');
      setReplyingTo(null);
      toast.success('Balasan terkirim');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedReports = reports.reduce((acc, report) => {
    const shipmentId = report.shipment_id;
    if (!acc[shipmentId]) {
      acc[shipmentId] = [];
    }
    acc[shipmentId].push(report);
    return acc;
  }, {} as Record<string, KendalaReport[]>);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Memuat data forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="bg-white/60 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard Admin
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Forum Chat Admin
                  </h1>
                  <p className="text-slate-500 font-medium">
                    Kelola laporan kendala dari driver
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Percakapan Aktif</p>
                  <p className="text-3xl font-bold">{Object.keys(groupedReports).length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Total Pesan</p>
                  <p className="text-3xl font-bold">{reports.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 border-0 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Hari Ini</p>
                  <p className="text-3xl font-bold">
                    {reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Groups by Shipment */}
        <div className="space-y-6">
          {Object.keys(groupedReports).length === 0 ? (
            <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="text-center py-16">
                <MessageSquare className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Belum ada laporan kendala</h3>
                <p className="text-gray-500">Laporan akan muncul di sini ketika driver mengirim pesan</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedReports).map(([shipmentId, shipmentReports]) => {
              const firstReport = shipmentReports[0];
              const shipment = firstReport.shipments;
              
              return (
                <Card key={shipmentId} className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      {shipment?.no_surat_jalan || 'No. Surat Jalan Tidak Diketahui'}
                    </CardTitle>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><span className="font-medium">Perusahaan:</span> {shipment?.perusahaan || 'Tidak diketahui'}</p>
                      <p><span className="font-medium">Tujuan:</span> {shipment?.tujuan || 'Tidak diketahui'}</p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    {/* Messages */}
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                      {shipmentReports.map((report) => (
                        <div
                          key={report.id}
                          className={`p-4 rounded-xl transition-all duration-300 ${
                            report.author_name.includes('(Admin)')
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 ml-8 shadow-md'
                              : 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-l-gray-300 mr-8 shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className={`font-semibold text-sm px-3 py-1 rounded-full ${
                              report.author_name.includes('(Admin)') 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {report.author_name}
                            </span>
                            <span className="text-xs text-slate-500 bg-white/60 px-2 py-1 rounded-full">
                              {formatTime(report.created_at)}
                            </span>
                          </div>
                          <p className="text-slate-700 mb-3 leading-relaxed">{report.message}</p>
                          {report.photo_url && (
                            <div className="relative">
                              <img
                                src={report.photo_url}
                                alt="Foto laporan"
                                className="max-w-full h-48 object-cover rounded-lg border shadow-md hover:shadow-lg transition-shadow duration-300"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    <div className="border-t border-slate-200 pt-6">
                      {replyingTo === shipmentId ? (
                        <div className="space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                          <Textarea
                            placeholder="Tulis balasan untuk driver..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            className="min-h-20 bg-white/60 backdrop-blur-sm border-blue-200 focus:border-blue-400 transition-colors duration-300"
                          />
                          
                          <ImageUpload
                            onImageUploaded={setReplyImage}
                            onImageRemoved={() => setReplyImage('')}
                            currentImageUrl={replyImage}
                          />

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleSendReply(shipmentId)}
                              disabled={isSending || (!replyMessage.trim() && !replyImage)}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {isSending ? 'Mengirim...' : 'Kirim Balasan'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyMessage('');
                                setReplyImage('');
                              }}
                              className="bg-white/60 backdrop-blur-sm border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setReplyingTo(shipmentId)}
                          variant="outline"
                          className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 text-blue-700 font-medium transition-all duration-300 hover:shadow-md"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Balas Pesan
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminForum;
