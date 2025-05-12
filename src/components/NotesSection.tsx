
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  author: string;
}

const NotesSection = () => {
  const [noteContent, setNoteContent] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 5;
  const { toast } = useToast();
  const { user } = useAuth();

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("dashboard-notes");
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("dashboard-notes", JSON.stringify(notes));
    }
  }, [notes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!noteContent.trim()) {
      toast({
        title: "Catatan kosong",
        description: "Silakan isi catatan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login diperlukan",
        description: "Silakan login untuk menambahkan catatan",
        variant: "destructive",
      });
      return;
    }

    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: noteContent,
      createdAt: new Date(),
      author: user.email || "Pengguna",
    };

    setNotes([newNote, ...notes]);
    setNoteContent("");
    
    toast({
      title: "Catatan ditambahkan",
      description: "Catatan berhasil disimpan",
    });
  };

  // Pagination logic
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = notes.slice(indexOfFirstNote, indexOfLastNote);
  const totalPages = Math.ceil(notes.length / notesPerPage);

  // Format date to Indonesian format
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="h-full bg-gradient-to-br from-white to-purple-100 border border-purple-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-purple-900">Catatan</CardTitle>
        <CardDescription className="text-purple-700">
          Tambahkan catatan atau informasi penting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <Textarea
            placeholder="Tulis catatan atau informasi penting di sini..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-[100px] border-purple-200 focus:border-purple-400"
          />
          <Button 
            type="submit"
            className="bg-gradient-ocean text-white hover:opacity-90"
          >
            Kirim Catatan
          </Button>
        </form>
        
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium text-purple-900">Catatan Terbaru</h3>
          
          {currentNotes.length === 0 ? (
            <div className="p-4 bg-white/50 rounded-md text-purple-700 text-center">
              Belum ada catatan yang ditambahkan
            </div>
          ) : (
            <div className="space-y-4">
              {currentNotes.map((note) => (
                <div 
                  key={note.id} 
                  className="p-4 bg-white/70 rounded-md border border-purple-100 shadow-sm"
                >
                  <div className="text-sm text-purple-600 mb-1">
                    {note.author} · {formatDate(note.createdAt)}
                  </div>
                  <p className="text-black whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {notes.length > notesPerPage && (
          <Pagination className="mx-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNumber = i + 1;
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={pageNumber === currentPage}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  );
};

export default NotesSection;
