'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createRoot } from 'react-dom/client';

// Dynamically import Barcode to prevent SSR issues
const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

export default function BarcodeGenerator() {
  const [unitPrice, setUnitPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [productCode, setProductCode] = useState('');
  const [barcodes, setBarcodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const canvasRef = useRef(null);

  const calculatePrice = (price, weight) => {
    if (price && weight) {
      return (parseFloat(price) * parseFloat(weight)).toFixed(2);
    }
    return '';
  };

  const searchProduct = async () => {  
    if (!productCode) return;  

    setIsLoading(true);  
    setErrorMessage('');  
    try {  
      const response = await fetch(`https://qr.villagemeatagro.com/barcodes/${productCode}`);  
      if (response.status === 404) {
        setBarcodes([]);
        setErrorMessage('No product found with this code');
        return;
      }
      if (!response.ok) {  
        throw new Error(`HTTP error! status: ${response.status}`);  
      }  
      
      const data = await response.json();  
      
      let validBarcodes = [];  

      if (Array.isArray(data)) {  
        validBarcodes = data.map(item => ({  
          id: item.barcode.toString(),
          value: item.barcode,
          amount: item.amount
        }));  
      } else if (data && typeof data === 'object') {  
        validBarcodes = data.barcodes  
          ? data.barcodes.map(item => ({  
              id: item.id.toString(),
              value: item.barcode,  
            }))  
          : [];  
      }  

      setBarcodes(validBarcodes);  
    } catch (error) {  
      setBarcodes([]);
      setErrorMessage('Unable to fetch product data. Please try again.');
    } finally {  
      setIsLoading(false);  
    }  
  };

  const handleGeneratePNG = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Increase canvas size and scale for higher quality
    const scale = 3; // Triple the resolution
    canvas.width = 300 * scale;
    canvas.height = 120 * scale;
    
    // Scale everything up
    ctx.scale(scale, scale);
    
    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 300, 120);
    
    // Set up text styling
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle'
    
    // Draw headers
    const headerY = 20;
    ctx.textAlign = 'left';
    ctx.fillText('Unite Price', 10, headerY);
    ctx.textAlign = 'center';
    ctx.fillText('Weight', 150, headerY);
    ctx.textAlign = 'right';
    ctx.fillText('Price', 290, headerY);
    
    // Draw values
    const valueY = 35;
    ctx.textAlign = 'left';
    ctx.fillText(`${unitPrice}/kg`, 10, valueY);
    ctx.textAlign = 'center';
    ctx.fillText(`${weight} kg`, 150, valueY);
    ctx.textAlign = 'right';
    ctx.fillText(price, 290, valueY);
    
    // Draw line
    ctx.beginPath()
    ctx.moveTo(10, valueY + 7)
    ctx.lineTo(290, valueY + 7)
    ctx.stroke()
    
    // Create temporary container for barcode
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute'
    tempContainer.style.visibility = 'hidden'
    document.body.appendChild(tempContainer);
    
    // Render the barcode to the temporary container
    const root = createRoot(tempContainer)
    await new Promise(resolve => {
      root.render(
        <Barcode
          value={selectedBarcode}
          width={2}
          height={50}
          fontSize={14}
          margin={0}
          displayValue={true}
        />
      )
      setTimeout(resolve, 100) // Give time for the barcode to render
    })

    // Get the rendered barcode SVG
    const barcodeSVG = tempContainer.querySelector('svg')
    if (barcodeSVG) {
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(barcodeSVG)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)
    
      // Create an image from the SVG
      const img = new Image()
      img.crossOrigin = 'anonymous'
    
      await new Promise(resolve => {
        img.onload = () => {
          // Draw the barcode image with improved quality
          ctx.drawImage(img, 10, valueY + 10, 280, 60)
          resolve()
        }
        img.src = svgUrl
      })
    
      // Cleanup
      URL.revokeObjectURL(svgUrl)
    }
  
    // Remove temporary container
    root.unmount()
    document.body.removeChild(tempContainer)

    // Generate download link
    const pngUrl = canvas.toDataURL('image/png', 1.0);
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `barcode-${selectedBarcode}.png`;
    downloadLink.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="mb-8 mt-4">
        <img
          src="https://github.com/Sabbir-Hasan303/Sabbir-s-Blog/blob/main/images/VMAI%20Images/logo.png?raw=true"
          alt="VMAI Logo"
          className="h-24 w-auto"
        />
      </div>

      <Card className="w-full max-w-xl shadow-lg border-gray-200">
        <CardContent className="space-y-6 pt-6">
          <div className='w-full flex justify-end font-bold text-sm'>Duck Product Code: 1050</div>
          <div className="space-y-2">
            <Label htmlFor="productCode">Product Code</Label>
            <div className="flex gap-2">
              <Input
                id="productCode"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Enter product code"
                className="flex-1"
              />
              <Button
                onClick={searchProduct}
                disabled={isLoading || !productCode}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errorMessage && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (per kg)</Label>
              <Input
                id="unitPrice"
                value={unitPrice}
                onChange={(e) => {
                  setUnitPrice(e.target.value);
                  setPrice(calculatePrice(e.target.value, weight));
                }}
                type="number"
                step="0.01"
                placeholder="Enter unit price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setPrice(calculatePrice(unitPrice, e.target.value));
                }}
                type="number"
                step="0.01"
                placeholder="Enter weight"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Select Barcode</Label>
              <Select value={selectedBarcode} onValueChange={setSelectedBarcode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a barcode" />
                </SelectTrigger>
                <SelectContent>
                  {barcodes.length > 0 ? (
                    barcodes.map((barcode) => (
                      <SelectItem key={barcode.id} value={barcode.value}>
                        Weight - {barcode.amount}gm
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-barcodes" disabled>
                      No barcodes available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (calculated)</Label>
              <Input
                id="price"
                value={price}
                readOnly
                className="bg-muted"
                placeholder="Calculated price"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm border-b pb-2">
              <div>
                <p className="font-medium">Unite Price</p>
                <p>{unitPrice ? `${unitPrice}/kg` : 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="font-medium">Weight</p>
                <p>{weight ? `${weight} kg` : 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Price</p>
                <p>{price || 'N/A'}</p>
              </div>
            </div>

            <div className="flex justify-center barcode-container">
              {selectedBarcode && (
                <Barcode
                  value={selectedBarcode}
                  width={2}
                  height={80}
                  displayValue={true}
                  fontSize={16}
                  textAlign="center"
                  textPosition="bottom"
                  textMargin={6}
                  margin={0}
                />
              )}
            </div>
          </div>

          <Button
            onClick={handleGeneratePNG}
            disabled={!selectedBarcode || !unitPrice || !weight}
            className="w-full bg-gray-500 hover:bg-gray-600"
          >
            Generate PNG
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

