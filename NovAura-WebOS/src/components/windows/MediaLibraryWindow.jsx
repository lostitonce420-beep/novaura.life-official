import React, { useState, useEffect, useRef } from 'react';
import { Upload, Folder, Image as ImageIcon, Video, File, Download, Trash2, Search, Grid, List, Plus, FileText, Music } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { BACKEND_URL, getAuthHeaders } from '../../services/aiService';

// getAuthHeaders imported from aiService

export default function MediaLibraryWindow() {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    let filtered = files;
    if (filterType !== 'all') {
      filtered = filtered.filter(f => f.type === filterType);
    }
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredFiles(filtered);
  }, [files, searchQuery, filterType]);

  const loadFiles = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/media/list`, {
        headers: getAuthHeaders()
      });
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to access your files');
      } else {
        toast.error('Failed to load media library');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const uploadFiles = Array.from(e.target.files);
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => formData.append('files', file));

      await axios.post(`${BACKEND_URL}/api/media/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(`${uploadFiles.length} file(s) uploaded!`);
      loadFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadFile = async (file) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/media/download/${file.id}`, {
        responseType: 'blob',
        headers: getAuthHeaders()
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('File downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/media/delete/${fileId}`, {
        headers: getAuthHeaders()
      });
      toast.success('File deleted');
      loadFiles();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  const deleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedFiles).map(id =>
          axios.delete(`${BACKEND_URL}/api/media/delete/${id}`, { headers: getAuthHeaders() })
        )
      );
      toast.success(`${selectedFiles.size} file(s) deleted`);
      setSelectedFiles(new Set());
      loadFiles();
    } catch (error) {
      toast.error('Failed to delete files');
    }
  };

  const toggleFileSelection = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) newSelected.delete(fileId);
    else newSelected.add(fileId);
    setSelectedFiles(newSelected);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'video': return Video;
      case 'audio': return Music;
      case 'document': return FileText;
      default: return File;
    }
  };

  const getFilePreview = (file) => {
    if (file.type === 'image') {
      return (
        <img
          src={`${BACKEND_URL}${file.url}`}
          alt={file.name}
          className="w-full h-full object-cover"
          data-testid={`file-preview-${file.id}`}
        />
      );
    }
    const Icon = getFileIcon(file.type);
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <Icon className="w-12 h-12 text-muted-foreground" />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-window-bg to-window-header" data-testid="media-library-window">
      {/* Header */}
      <div className="px-6 py-4 border-b border-primary/20 bg-window-header">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Media Library</h3>
              <p className="text-xs text-muted-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              data-testid="file-upload-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(0,217,255,0.3)]"
              data-testid="upload-files-btn"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>

            {selectedFiles.size > 0 && (
              <Button onClick={deleteSelected} variant="destructive" data-testid="delete-selected-btn">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedFiles.size})
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-10 bg-window-bg border-primary/20"
              data-testid="search-files-input"
            />
          </div>

          <Tabs value={filterType} onValueChange={setFilterType}>
            <TabsList className="bg-window-bg">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="document">Docs</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-1">
            <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} data-testid="view-grid-btn">
              <Grid className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} data-testid="view-list-btn">
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 scrollbar-custom p-6">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center" data-testid="empty-library">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Folder className="w-12 h-12 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || filterType !== 'all' ? 'No files found' : 'No files yet'}
            </h4>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload files to get started'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <Button onClick={() => fileInputRef.current?.click()} className="bg-primary hover:bg-primary/90" data-testid="upload-first-file-btn">
                <Plus className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="files-grid">
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                data-testid={`file-card-${file.id}`}
                className={`group relative overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                  selectedFiles.has(file.id) ? 'border-primary bg-primary/5' : 'border-primary/20'
                }`}
                onClick={() => toggleFileSelection(file.id)}
              >
                <div className="aspect-square overflow-hidden">{getFilePreview(file)}</div>
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate mb-1">{file.name}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{file.type}</Badge>
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/90 backdrop-blur" onClick={(e) => { e.stopPropagation(); downloadFile(file); }} data-testid={`download-${file.id}`}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 bg-destructive/90 backdrop-blur" onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }} data-testid={`delete-${file.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {selectedFiles.has(file.id) && (
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-xs">&#10003;</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2" data-testid="files-list">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <Card
                  key={file.id}
                  data-testid={`file-row-${file.id}`}
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${
                    selectedFiles.has(file.id) ? 'border-primary bg-primary/5' : 'border-primary/20 hover:border-primary/40'
                  }`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{file.type} - {file.size}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); downloadFile(file); }}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
