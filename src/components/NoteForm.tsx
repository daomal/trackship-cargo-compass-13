
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Note } from "@/lib/types";

const ITEMS_PER_PAGE = 5;

const NoteForm: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchNotes();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:notes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notes' 
      }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Gagal memuat catatan');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Catatan tidak boleh kosong');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('notes')
        .insert([{ 
          content,
          author_name: authorName || 'Anonim',
          user_id: user?.id
        }]);
        
      if (error) throw error;
      
      toast.success('Catatan berhasil ditambahkan');
      setContent("");
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Gagal menambahkan catatan');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(notes.length / ITEMS_PER_PAGE);
  
  // Get current page items
  const currentNotes = notes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forum Catatan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Form untuk menambahkan catatan */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Input
                placeholder="Nama Anda (opsional)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full"
              />
              <div className="flex gap-4">
                <Textarea
                  placeholder="Tuliskan catatan anda disini..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[80px] flex-1"
                />
                <Button type="submit" disabled={isLoading} className="self-end">
                  {isLoading ? "Mengirim..." : "Kirim"}
                </Button>
              </div>
            </div>
          </form>
          
          {/* Daftar catatan */}
          <div className="space-y-4 mt-6">
            {currentNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada catatan
              </div>
            ) : (
              currentNotes.map((note) => (
                <div 
                  key={note.id} 
                  className="p-4 bg-white/50 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{note.author_name}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else {
                      // For more pages, show window around current page
                      const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                      pageNumber = start + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteForm;
