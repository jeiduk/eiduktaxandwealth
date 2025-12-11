import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  FileText,
  Download,
  FolderOpen
} from 'lucide-react';

interface DocumentWithClient {
  id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  created_at: string;
  client_id: string;
  clients: {
    first_name: string;
    last_name: string;
    company_name: string | null;
  };
}

export default function Documents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentWithClient[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocumentWithClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, categoryFilter]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(d => d.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.clients?.first_name.toLowerCase().includes(query) ||
        d.clients?.last_name.toLowerCase().includes(query) ||
        d.clients?.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredDocs(filtered);
  };

  const handleDownload = async (doc: DocumentWithClient) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: error.message || 'Failed to download document',
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const categories = ['All', 'Tax Returns', 'Business Documents', 'Financial Statements', 'Payroll', 'Roadmap', 'General'];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Documents</h1>
          <p className="text-muted-foreground mt-1">
            All client documents in one place
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'navy' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Document List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-card animate-pulse" />
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                {searchQuery || categoryFilter !== 'All' 
                  ? 'No documents found' 
                  : 'No documents yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Upload documents from a client\'s detail page'}
              </p>
              {!searchQuery && categoryFilter === 'All' && (
                <Button variant="navy" asChild>
                  <Link to="/clients">Go to Clients</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredDocs.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-eiduk-blue/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-eiduk-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Link 
                            to={`/clients/${doc.client_id}`}
                            className="hover:text-secondary hover:underline"
                          >
                            {doc.clients?.first_name} {doc.clients?.last_name}
                          </Link>
                          <span>•</span>
                          <span>{doc.category}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
