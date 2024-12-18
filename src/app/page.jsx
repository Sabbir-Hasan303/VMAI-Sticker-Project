'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Barcode from 'react-barcode'
import { createRoot } from 'react-dom/client'

export default function BarcodeGenerator() {
  const [unitPrice, setUnitPrice] = useState('')
  const [weight, setWeight] = useState('')
  const [barcodeNumber, setBarcodeNumber] = useState('')
  const [price, setPrice] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    if (unitPrice && weight) {
      const calculatedPrice = (parseFloat(unitPrice) * parseFloat(weight)).toFixed(2)
      setPrice(calculatedPrice)
    }
  }, [unitPrice, weight])

  const handleGeneratePNG = async () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Increase canvas size for higher resolution
    const scale = 3 // Tripling the resolution
    canvas.width = 300 * scale
    canvas.height = 120 * scale

    // Scale the context to maintain visual size
    ctx.scale(scale, scale)

    // Draw white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, 300, 120)

    // Draw labels with improved font rendering
    ctx.fillStyle = 'black'
    ctx.font = '12px Arial'
    ctx.textBaseline = 'middle'
    
    // Draw header text
    const headerY = 20
    ctx.textAlign = 'left'
    ctx.fillText(`Unite Price`, 10, headerY)
    ctx.textAlign = 'center'
    ctx.fillText(`Weight`, 150, headerY)
    ctx.textAlign = 'right'
    ctx.fillText(`Price`, 290, headerY)

    // Draw values
    const valueY = 35
    ctx.textAlign = 'left'
    ctx.fillText(`${unitPrice}/kg`, 10, valueY)
    ctx.textAlign = 'center'
    ctx.fillText(`${weight} kg`, 150, valueY)
    ctx.textAlign = 'right'
    ctx.fillText(`${price}`, 290, valueY)

    // Draw line
    // ctx.beginPath()
    // ctx.moveTo(10, valueY + 5)
    // ctx.lineTo(290, valueY + 5)
    // ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(10, valueY + 7)
    ctx.lineTo(290, valueY + 7)
    ctx.stroke()
    

    // Create a temporary container for the barcode
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.visibility = 'hidden'
    document.body.appendChild(tempContainer)

    // Render the barcode to the temporary container
    const root = createRoot(tempContainer)
    await new Promise(resolve => {
      root.render(
        <Barcode
          value={barcodeNumber}
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

    // Generate download link with high-quality PNG
    const pngUrl = canvas.toDataURL('image/png', 1.0)
    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = `barcode-${barcodeNumber}.png`
    downloadLink.click()
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <div className="mb-8 mt-4">
        <img 
          src="/assets/logo.jpg" 
          alt="VMAI Logo" 
          className="h-24 w-auto"
        />
      </div>

      <Card className="w-full max-w-xl">
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (per kg)</Label>
              <Input
                id="unitPrice"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
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
                onChange={(e) => setWeight(e.target.value)}
                type="number"
                step="0.01"
                placeholder="Enter weight"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcodeNumber">Barcode Number</Label>
              <Input
                id="barcodeNumber"
                value={barcodeNumber}
                onChange={(e) => setBarcodeNumber(e.target.value)}
                placeholder="Enter barcode number"
              />
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

          <div className="border rounded-lg p-6 bg-white">
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm border-b pb-4">
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
            <div className="flex justify-center barcode-canvas">
              {barcodeNumber && (
                <Barcode 
                  value={barcodeNumber}
                  width={2}
                  height={40}  
                  fontSize={14}
                  margin={0}
                />
              )}
            </div>
          </div>

          <Button 
            className="w-full"
            onClick={handleGeneratePNG}
            disabled={!unitPrice || !weight || !barcodeNumber || !price}
          >
            Generate PNG
          </Button>

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </CardContent>
      </Card>
    </div>
  )
}

