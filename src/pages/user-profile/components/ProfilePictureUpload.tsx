import React, { useRef, useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

interface ProfilePictureUploadProps {
  currentPicture: string;
  currentPictureAlt: string;
  onUpload: (file: File) => void;
  error?: string;
}

const ProfilePictureUpload = ({ currentPicture, currentPictureAlt, onUpload, error }: ProfilePictureUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onUpload(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted">
        <Image
          src={preview || currentPicture}
          alt={currentPictureAlt}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Icon name="Camera" size={32} color="white" />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload profile picture"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        iconName="Upload"
        iconPosition="left"
      >
        Change Picture
      </Button>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Supported formats: JPEG, PNG, WebP (Max 5MB)
      </p>
    </div>
  );
};

export default ProfilePictureUpload;