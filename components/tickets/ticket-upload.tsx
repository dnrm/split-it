'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TicketUploadResponse } from '@/types';

interface TicketUploadProps {
  groupId: string;
  onUploadComplete?: (ticketId: string) => void;
  className?: string;
}

export function TicketUpload({ groupId, onUploadComplete, className }: TicketUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('groupId', groupId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/tickets/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data: TicketUploadResponse = await response.json();
      setTicketId(data.ticketId);
      toast.success('Image uploaded successfully!');

      // Start parsing
      setParsing(true);
      setUploadProgress(0);

      // Parse the ticket
      const parseResponse = await fetch('/api/tickets/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: data.ticketId }),
      });

      if (!parseResponse.ok) {
        const error = await parseResponse.json();
        throw new Error(error.error || 'Parsing failed');
      }

      const parseData = await parseResponse.json();
      setParsing(false);
      setUploadProgress(100);

      toast.success(`Ticket parsed successfully! Confidence: ${Math.round(parseData.confidence * 100)}%`);

      // Call completion callback or redirect
      if (onUploadComplete) {
        onUploadComplete(data.ticketId);
      } else {
        router.push(`/dashboard/tickets/${data.ticketId}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setUploading(false);
      setParsing(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploading(false);
    setParsing(false);
    setUploadProgress(0);
    setTicketId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Receipt
        </CardTitle>
        <CardDescription>
          Upload a receipt or ticket image to automatically extract items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop your receipt here</p>
              <p className="text-sm text-muted-foreground">
                or{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPEG, PNG, WebP (max 10MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={uploading || parsing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload Progress */}
            {(uploading || parsing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {uploading ? 'Uploading...' : 'Parsing receipt...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Status Messages */}
            {ticketId && !parsing && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Upload complete! Processing receipt...</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!uploading && !parsing && !ticketId && (
                <Button onClick={uploadFile} className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Parse
                </Button>
              )}
              
              {(uploading || parsing) && (
                <Button disabled className="flex-1">
                  {uploading ? 'Uploading...' : 'Parsing...'}
                </Button>
              )}

              {ticketId && !parsing && (
                <div className="flex gap-2 flex-1">
                  <Button
                    variant="outline"
                    onClick={resetUpload}
                    className="flex-1"
                  >
                    Upload Another
                  </Button>
                  <Button
                    onClick={() => router.push(`/dashboard/tickets/${ticketId}`)}
                    className="flex-1"
                  >
                    View Ticket
                  </Button>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Tips for best results:</strong></p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Ensure the receipt is well-lit and clear</li>
                    <li>Make sure all text is readable</li>
                    <li>Try to get the entire receipt in frame</li>
                    <li>Common formats work best: restaurant bills, store receipts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
