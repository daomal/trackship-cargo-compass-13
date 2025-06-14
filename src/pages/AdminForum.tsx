
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, MessageSquare, Users, Clock } from 'lucide-react';
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
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard Admin
          </Button>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                Forum Chat & Laporan Kendala Admin
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{Object.keys(groupedReports).length} Percakapan Aktif</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{reports.length} Total Pesan</span>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Chat Groups by Shipment */}
        <div className="space-y-6">
          {Object.keys(groupedReports).length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Belum ada laporan kendala dari driver</p>
                <p className="text-gray-500 text-sm mt-2">Laporan akan muncul di sini ketika driver mengirim pesan</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedReports).map(([shipmentId, shipmentReports]) => {
              const firstReport = shipmentReports[0];
              const shipment = firstReport.shipments;
              
              return (
                <Card key={shipmentId} className="bg-white shadow-lg">
                  <CardHeader className="border-b">
                    <CardTitle className="text-lg">
                      {shipment?.no_surat_jalan || 'No. Surat Jalan Tidak Diketahui'}
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      <p><strong>Perusahaan:</strong> {shipment?.perusahaan || 'Tidak diketahui'}</p>
                      <p><strong>Tujuan:</strong> {shipment?.tujuan || 'Tidak diketahui'}</p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    {/* Messages */}
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                      {shipmentReports.map((report) => (
                        <div
                          key={report.id}
                          className={`p-4 rounded-lg ${
                            report.author_name.includes('(Admin)')
                              ? 'bg-blue-50 border-l-4 border-l-blue-500 ml-8'
                              : 'bg-gray-50 border-l-4 border-l-gray-300 mr-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`font-semibold ${
                              report.author_name.includes('(Admin)') ? 'text-blue-800' : 'text-gray-800'
                            }`}>
                              {report.author_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(report.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{report.message}</p>
                          {report.photo_url && (
                            <img
                              src={report.photo_url}
                              alt="Foto laporan"
                              className="max-w-full h-48 object-cover rounded-lg border"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    <div className="border-t pt-4">
                      {replyingTo === shipmentId ? (
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Tulis balasan untuk driver..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            className="min-h-20"
                          />
                          
                          <ImageUpload
                            onImageUploaded={setReplyImage}
                            onImageRemoved={() => setReplyImage('')}
                            currentImageUrl={replyImage}
                          />

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSendReply(shipmentId)}
                              disabled={isSending || (!replyMessage.trim() && !replyImage)}
                              className="bg-blue-600 hover:bg-blue-700"
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
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setReplyingTo(shipmentId)}
                          variant="outline"
                          className="w-full"
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
