'use client';

import { useEffect, useState, use } from 'react';
import { FaChevronLeft, FaTrashAlt } from 'react-icons/fa';
import DatasetImageCard from '@/components/DatasetImageCard';
import { Button } from '@headlessui/react';
import AddImagesModal, { openImagesModal } from '@/components/AddImagesModal';
import { TopBar, MainContent } from '@/components/layout';
import { apiClient } from '@/utils/api';
import { openConfirm } from '@/components/ConfirmModal';

export default function DatasetPage({ params }: { params: { datasetName: string } }) {
  const [imgList, setImgList] = useState<{ img_path: string }[]>([]);
  const usableParams = use(params as any) as { datasetName: string };
  const datasetName = usableParams.datasetName;
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const refreshImageList = (dbName: string) => {
    setStatus('loading');
    console.log('Fetching images for dataset:', dbName);
    apiClient
      .post('/api/datasets/listImages', { datasetName: dbName })
      .then((res: any) => {
        const data = res.data;
        console.log('Images:', data.images);
        // sort
        data.images.sort((a: { img_path: string }, b: { img_path: string }) => a.img_path.localeCompare(b.img_path));
        setImgList(data.images);
        setStatus('success');
        // Clear selections when refreshing
        setSelectedImages([]);
      })
      .catch(error => {
        console.error('Error fetching images:', error);
        setStatus('error');
      });
  };
  
  useEffect(() => {
    if (datasetName) {
      refreshImageList(datasetName);
    }
  }, [datasetName]);

  const handleSelectImage = (imagePath: string, selected: boolean) => {
    if (selected) {
      setSelectedImages(prev => [...prev, imagePath]);
    } else {
      setSelectedImages(prev => prev.filter(path => path !== imagePath));
    }
  };

  const handleSelectAll = () => {
    if (selectedImages.length === imgList.length) {
      // If all are selected, deselect all
      setSelectedImages([]);
    } else {
      // Otherwise select all
      setSelectedImages(imgList.map(img => img.img_path));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedImages.length === 0) return;
    
    openConfirm({
      title: 'Delete Selected Images',
      message: `Are you sure you want to delete ${selectedImages.length} selected images? This action cannot be undone.`,
      type: 'warning',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          // Delete all selected images one by one
          await Promise.all(
            selectedImages.map(imgPath => 
              apiClient.post('/api/img/delete', { imgPath })
            )
          );
          
          console.log('Deleted images:', selectedImages);
          refreshImageList(datasetName);
        } catch (error) {
          console.error('Error deleting images:', error);
        }
      }
    });
  };

  return (
    <>
      {/* Fixed top bar */}
      <TopBar>
        <div>
          <Button className="text-gray-500 dark:text-gray-300 px-3 mt-1" onClick={() => history.back()}>
            <FaChevronLeft />
          </Button>
        </div>
        <div>
          <h1 className="text-lg">Dataset: {datasetName}</h1>
        </div>
        <div className="flex-1"></div>
        
        {selectedImages.length > 0 && (
          <div className="mr-2">
            <Button
              className="text-gray-200 bg-red-600 px-4 py-2 rounded-md hover:bg-red-500 transition-colors flex items-center"
              onClick={handleDeleteSelected}
            >
              <FaTrashAlt className="mr-2" />
              Delete Selected ({selectedImages.length})
            </Button>
          </div>
        )}
        
        <div className="mr-2">
          <Button
            className="text-gray-200 bg-slate-600 px-3 py-1 rounded-md"
            onClick={handleSelectAll}
          >
            {selectedImages.length === imgList.length && imgList.length > 0 
              ? 'Deselect All' 
              : 'Select All'}
          </Button>
        </div>
        
        <div>
          <Button
            className="text-gray-200 bg-slate-600 px-3 py-1 rounded-md"
            onClick={() => openImagesModal(datasetName, () => refreshImageList(datasetName))}
          >
            Add Images
          </Button>
        </div>
      </TopBar>
      <MainContent>
        {status === 'loading' && <p>Loading...</p>}
        {status === 'error' && <p>Error fetching images</p>}
        {status === 'success' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imgList.length === 0 && <p>No images found</p>}
            {imgList.map(img => (
              <DatasetImageCard
                key={img.img_path}
                alt="image"
                imageUrl={img.img_path}
                onDelete={() => refreshImageList(datasetName)}
                selected={selectedImages.includes(img.img_path)}
                onSelect={(selected) => handleSelectImage(img.img_path, selected)}
              />
            ))}
          </div>
        )}
      </MainContent>
      <AddImagesModal />
    </>
  );
}
