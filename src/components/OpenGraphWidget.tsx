import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Globe, Link, Image, FileText, Facebook, Search, MessageCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const FacebookPreview: React.FC<{ data: OpenGraphData }> = ({ data }) => (
  <div className="border border-gray-300 rounded-md p-4 bg-white">
    <h3 className="font-semibold text-lg mb-2 flex items-center">
      <Facebook className="mr-2" size={20} /> Facebook Preview
    </h3>
    <div className="max-w-[500px] border border-gray-300 rounded-md overflow-hidden">
      {data.image && (
        <img src={data.image} alt={data.title} className="w-full h-[261px] object-cover" />
      )}
      <div className="p-3">
        <p className="text-xs text-gray-500 uppercase mb-1">{new URL(data.url || '').hostname}</p>
        <h4 className="text-base font-semibold mb-1 text-[#1d2129]">{data.title}</h4>
        <p className="text-sm text-gray-500 line-clamp-2">{data.description}</p>
      </div>
    </div>
  </div>
);

const GooglePreview: React.FC<{ data: OpenGraphData }> = ({ data }) => (
  <div className="border border-gray-300 rounded-md p-4 bg-white">
    <h3 className="font-semibold text-lg mb-2 flex items-center">
      <Search className="mr-2" size={20} /> Google Preview
    </h3>
    <div className="max-w-[600px]">
      <p className="text-sm text-[#006621] mb-1">{data.url}</p>
      <h4 className="text-xl text-[#1a0dab] mb-1 hover:underline cursor-pointer">{data.title}</h4>
      <p className="text-sm text-[#545454] line-clamp-2">{data.description}</p>
    </div>
  </div>
);

const IMessagePreview: React.FC<{ data: OpenGraphData }> = ({ data }) => (
  <div className="border border-gray-300 rounded-md p-4 bg-white">
    <h3 className="font-semibold text-lg mb-2 flex items-center">
      <MessageCircle className="mr-2" size={20} /> iMessage Preview
    </h3>
    <div className="max-w-[300px] border border-gray-300 rounded-2xl overflow-hidden bg-[#f1f1f1]">
      {data.image && (
        <img src={data.image} alt={data.title} className="w-full h-[157px] object-cover" />
      )}
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-1">{new URL(data.url || '').hostname}</p>
        <h4 className="text-sm font-semibold mb-1">{data.title}</h4>
        <p className="text-xs text-gray-600 line-clamp-2">{data.description}</p>
      </div>
    </div>
  </div>
);

const DownloadCTA: React.FC<{ onDownload: () => void }> = ({ onDownload }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('https://services.leadconnectorhq.com/hooks/mZBqXJLpInc1VbPcqzY8/webhook-trigger/dfdc43c8-e6b5-46b1-9d3a-559a572a6d55', { email });
      setIsSubmitted(true);
      onDownload();
    } catch (error) {
      console.error('Error submitting email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center text-green-600 font-semibold">
        Thank you! Your PDF report is being generated.
      </div>
    );
  }

  return (
    <div className="bg-blue-100 p-4 rounded-md mt-6">
      <h3 className="text-lg font-semibold mb-2">Download Your Open Graph Preview Report</h3>
      <p className="mb-4">Enter your email to receive a PDF report of the Open Graph previews.</p>
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? 'Submitting...' : (
            <>
              <Download className="mr-2" size={16} />
              Download PDF
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const OpenGraphWidget: React.FC = () => {
  const [url, setUrl] = useState('');
  const [ogData, setOgData] = useState<OpenGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 90) return oldProgress;
          const newProgress = oldProgress + Math.random() * 10;
          return Math.min(newProgress, 90);
        });
      }, 500);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const fetchOpenGraphData = async () => {
    setLoading(true);
    setError('');
    setOgData(null);
    setProgress(0);

    try {
      const response = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const html = response.data.contents;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const data: OpenGraphData = {
        title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.title,
        description: doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || doc.querySelector('meta[name="description"]')?.getAttribute('content'),
        image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        url: doc.querySelector('meta[property="og:url"]')?.getAttribute('content') || url,
      };

      setOgData(data);
      setProgress(100);
    } catch (err) {
      setError('Failed to fetch Open Graph data. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('open-graph-preview.pdf');
    }
  };

  return (
    <div className="max-w-3xl w-full bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Open Graph Data Viewer</h2>
      <div className="flex mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL"
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchOpenGraphData}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Fetch'}
        </button>
      </div>
      {loading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Fetching data... {progress.toFixed(0)}%</p>
        </div>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {ogData && (
        <>
          <div ref={previewRef}>
            <div className="bg-gray-100 p-4 rounded-md mb-6">
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <Globe className="mr-2" size={20} /> Open Graph Data
              </h3>
              <div className="space-y-2">
                <p className="flex items-center">
                  <Link className="mr-2" size={16} />
                  <span className="font-semibold">URL:</span> {ogData.url || 'N/A'}
                </p>
                <p className="flex items-center">
                  <FileText className="mr-2" size={16} />
                  <span className="font-semibold">Title:</span> {ogData.title || 'N/A'}
                </p>
                <p className="flex items-center">
                  <FileText className="mr-2" size={16} />
                  <span className="font-semibold">Description:</span> {ogData.description || 'N/A'}
                </p>
                {ogData.image && (
                  <div>
                    <p className="flex items-center mb-2">
                      <Image className="mr-2" size={16} />
                      <span className="font-semibold">Image:</span>
                    </p>
                    <img src={ogData.image} alt="Open Graph" className="max-w-full h-auto rounded-md" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <FacebookPreview data={ogData} />
              <GooglePreview data={ogData} />
              <IMessagePreview data={ogData} />
            </div>
          </div>
          <DownloadCTA onDownload={generatePDF} />
        </>
      )}
    </div>
  );
};

export default OpenGraphWidget;