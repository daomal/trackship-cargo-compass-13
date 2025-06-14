
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
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
}

interface Shipment {
  id: string;
  no_surat_jalan: string;
  perusahaan: string;
  tujuan: string;
}

const ForumKendala = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [reports, setReports] = useState<KendalaReport[]>([]);
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentDetails();
      fetchReports();
      subscribeToReports();
    }
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    if (!shipmentId) return;

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, no_surat_jalan, perusahaan, tujuan')
        .eq('id', shipmentId)
        .single();

      if (error) {
        console.error('Error fetching shipment:', error);
        toast.error('Gagal memuat data pengiriman');
        return;
      }

      setShipment(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    }
  };

  const fetchReports = async () => {
    if (!shipmentId) return;

    try {
      const { data, error } = await supabase
        .from('kendala_reports')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToReports = () => {
    if (!shipmentId) return;

    const channel = supabase
      .channel(`kendala_reports_${shipmentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kendala_reports',
        filter: `shipment_id=eq.${shipmentId}`
      }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !imageUrl) {
      toast.error('Pesan tidak boleh kosong');
      return;
    }

    if (!user || !shipmentId) return;

    setIsSending(true);

    try {
      const { error } = await supabase
        .from('kendala_reports')
        .insert({
          shipment_id: shipmentId,
          user_id: user.id,
          author_name: profile?.name || user.email || 'Anonim',
          message: message.trim() || 'Foto terlampir',
          photo_url: imageUrl || null
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Gagal mengirim pesan');
        return;
      }

      setMessage('');
      setImageUrl('');
      toast.success('Pesan terkirim');
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/dashboard-supir')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>

          {shipment && (
            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquare className="h-6 w-6 text-red-600" />
                  Forum Kendala - {shipment.tujuan}
                </CardTitle>
                <div className="text-sm text-gray-600">
                  <p>No. Surat Jalan: <span className="font-semibold">{shipment.no_surat_jalan}</span></p>
                  <p>Perusahaan: <span className="font-semibold">{shipment.perusahaan}</span></p>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Chat Messages */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {reports.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada laporan kendala. Mulai percakapan!</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="bg-white shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-800">{report.author_name}</span>
                    <span className="text-xs text-gray-500">{formatTime(report.created_at)}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{report.message}</p>
                  {report.photo_url && (
                    <img
                      src={report.photo_url}
                      alt="Foto kendala"
                      className="max-w-full h-48 object-cover rounded-lg border"
                    />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Message Input */}
        <Card className="bg-white shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Textarea
                placeholder="Ketik pesan atau laporkan kendala..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-20"
              />
              
              <ImageUpload
                onImageUploaded={setImageUrl}
                onImageRemoved={() => setImageUrl('')}
                currentImageUrl={imageUrl}
              />

              <Button
                onClick={handleSendMessage}
                disabled={isSending || (!message.trim() && !imageUrl)}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Mengirim...' : 'Kirim Pesan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForumKendala;
