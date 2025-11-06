import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Folder,
  File,
  Upload,
  FolderPlus,
  Download,
  Trash2,
  ChevronRight,
  Home,
  Menu,
} from "lucide-react";
import { format } from "date-fns";

interface DriveFolder {
  id: number;
  name: string;
  parentId: number | null;
  createdById: number;
  createdByName: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DriveFile {
  id: number;
  name: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  folderId: number | null;
  uploadedById: number;
  uploadedByName: string;
  uploadedAt: string;
}

interface SupremoDriveProps {
  currentUser: { id: number; name: string; role: string };
  onOpenMobileMenu: () => void;
}

export default function SupremoDrive({ currentUser, onOpenMobileMenu }: SupremoDriveProps) {
  const { toast } = useToast();
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: number | null; name: string }>>([{ id: null, name: "Drive" }]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: folders = [] } = useQuery<DriveFolder[]>({
    queryKey: ['/api/drive/folders', currentFolderId],
  });

  const { data: files = [] } = useQuery<DriveFile[]>({
    queryKey: ['/api/drive/files', currentFolderId],
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('/api/drive/folders', 'POST', {
        name,
        parentId: currentFolderId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drive/folders'] });
      toast({ title: 'Folder created successfully' });
      setIsCreateFolderOpen(false);
      setNewFolderName("");
    },
    onError: () => {
      toast({ title: 'Failed to create folder', variant: 'destructive' });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId !== null) {
        formData.append('folderId', currentFolderId.toString());
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drive/files'] });
      toast({ title: 'File uploaded successfully' });
      setIsUploadOpen(false);
      setSelectedFile(null);
    },
    onError: () => {
      toast({ title: 'Failed to upload file', variant: 'destructive' });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/drive/folders/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drive/folders'] });
      toast({ title: 'Folder deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete folder', variant: 'destructive' });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/drive/files/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drive/files'] });
      toast({ title: 'File deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete file', variant: 'destructive' });
    },
  });

  const handleFolderClick = (folder: DriveFolder) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim());
    }
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadFileMutation.mutate(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = (file: DriveFile) => {
    const link = document.createElement('a');
    link.href = file.storagePath;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFolder = (folder: DriveFolder) => {
    if (confirm(`Delete folder "${folder.name}"? This will also delete all contents.`)) {
      deleteFolderMutation.mutate(folder.id);
    }
  };

  const handleDeleteFile = (file: DriveFile) => {
    if (confirm(`Delete file "${file.originalName}"?`)) {
      deleteFileMutation.mutate(file.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenMobileMenu}
            data-testid="button-open-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold" data-testid="text-supremo-drive-title">Supremo Drive</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-new-folder">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  data-testid="input-folder-name"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()} data-testid="button-create-folder">
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-file">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  data-testid="input-file-upload"
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsUploadOpen(false);
                    setSelectedFile(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleFileUpload} disabled={!selectedFile} data-testid="button-submit-upload">
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-1 p-3 border-b text-sm">
        {folderPath.map((path, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground" />}
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className="hover-elevate active-elevate-2 px-2 py-1 rounded-md flex items-center gap-1"
              data-testid={`breadcrumb-${index}`}
            >
              {index === 0 && <Home className="w-4 h-4" />}
              <span>{path.name}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {folders.length === 0 && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Folder className="w-16 h-16 mb-4 opacity-20" />
            <p>This folder is empty</p>
            <p className="text-sm">Create a folder or upload files to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="p-4 hover-elevate cursor-pointer" data-testid={`folder-${folder.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => handleFolderClick(folder)}>
                    <div className="flex items-center gap-3 mb-2">
                      <Folder className="w-8 h-8 text-primary" />
                      <div>
                        <div className="font-medium">{folder.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {folder.itemCount} {folder.itemCount === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Created by {folder.createdByName}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder);
                    }}
                    data-testid={`button-delete-folder-${folder.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {files.map((file) => (
              <Card key={file.id} className="p-4 hover-elevate" data-testid={`file-${file.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <File className="w-8 h-8 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate" title={file.originalName}>
                          {file.originalName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(file.uploadedAt), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by {file.uploadedByName}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file)}
                      data-testid={`button-download-file-${file.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFile(file)}
                      data-testid={`button-delete-file-${file.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
