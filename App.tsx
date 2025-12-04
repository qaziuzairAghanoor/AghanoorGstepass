import React, { useState, useEffect } from 'react';
import { Plus, Printer, Trash2, ArrowLeft, History, FileText, CheckCircle, Download, Search, Save } from 'lucide-react';
import { GatePassData, GatePassItem } from './types';
import { getPasses, savePasses, getNextPassNumber, incrementPassNumber } from './services/storage';
import { GatePassTemplate } from './components/GatePassTemplate';

function App() {
  const [view, setView] = useState<'form' | 'preview' | 'history'>('form');
  const [passes, setPasses] = useState<GatePassData[]>([]);
  const [nextNumber, setNextNumber] = useState<number>(1001);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Current Form State
  const [formData, setFormData] = useState({
    senderName: '',
    fromUnit: '',
    receiverName: '',
    targetUnit: '',
  });
  
  const [items, setItems] = useState<GatePassItem[]>([
    { 
      id: '1', 
      orderNumber: '', 
      workOrderNumber: '', 
      description: '', 
      orderQuantity: 0, 
      deliveredQuantity: 0 
    }
  ]);

  const [currentPass, setCurrentPass] = useState<GatePassData | null>(null);

  useEffect(() => {
    // Load initial data
    setPasses(getPasses());
    setNextNumber(getNextPassNumber());
  }, []);

  const handleAddItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      orderNumber: '', 
      workOrderNumber: '', 
      description: '', 
      orderQuantity: 0, 
      deliveredQuantity: 0 
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof GatePassItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new pass object
    const newPass: GatePassData = {
      id: Date.now().toString(),
      passNumber: nextNumber,
      createdAt: new Date().toISOString(),
      senderName: formData.senderName,
      fromUnit: formData.fromUnit,
      receiverName: formData.receiverName,
      targetUnit: formData.targetUnit,
      items: items.filter(i => i.description.trim() !== '') // Filter empty items
    };

    if (newPass.items.length === 0) {
      alert("Please add at least one item description.");
      return;
    }

    // Auto-save to history immediately upon generation
    const updatedPasses = [newPass, ...passes];
    setPasses(updatedPasses);
    savePasses(updatedPasses);
    
    // Increment counter for the next one
    incrementPassNumber(nextNumber);
    setNextNumber(nextNumber + 1);

    setCurrentPass(newPass);
    setView('preview');
  };

  // Shared logic to save the pass to history (fallback)
  const saveCurrentPassToHistory = () => {
    if (!currentPass) return;
    
    // Check if already saved
    const exists = passes.some(p => p.id === currentPass.id);
    if (exists) return;

    const updatedPasses = [currentPass, ...passes];
    setPasses(updatedPasses);
    savePasses(updatedPasses);
    incrementPassNumber(nextNumber);
    setNextNumber(nextNumber + 1);
  };

  const handleConfirmAndPrint = () => {
    saveCurrentPassToHistory();
    // Allow state to update before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleManualSave = () => {
    saveCurrentPassToHistory();
  };

  const handleDownloadPdf = () => {
    if (!currentPass) return;
    
    // Auto-save when downloading if not already saved
    const exists = passes.some(p => p.id === currentPass.id);
    if (!exists) {
      saveCurrentPassToHistory();
    }

    setIsGeneratingPdf(true);
    
    const element = document.getElementById('gate-pass-content');
    
    // Options for html2pdf
    const opt = {
      margin: 5, // 5mm margin around the page
      filename: `GatePass_GP-${currentPass.passNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Use window.html2pdf if available (loaded via CDN)
    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsGeneratingPdf(false);
      });
    } else {
      alert("PDF generator is loading... please try again in a moment.");
      setIsGeneratingPdf(false);
    }
  };

  const startNew = () => {
    setFormData({
      senderName: '',
      fromUnit: '',
      receiverName: '',
      targetUnit: '',
    });
    setItems([{ 
      id: Date.now().toString(), 
      orderNumber: '', 
      workOrderNumber: '', 
      description: '', 
      orderQuantity: 0, 
      deliveredQuantity: 0 
    }]);
    setCurrentPass(null);
    setView('form');
  };

  const deletePass = (id: string) => {
    if(confirm("Are you sure you want to delete this record from history?")) {
        const updated = passes.filter(p => p.id !== id);
        setPasses(updated);
        savePasses(updated);
    }
  }

  const handleViewHistoryItem = (pass: GatePassData) => {
    setCurrentPass(pass);
    setView('preview');
  };

  // Filter Logic
  const filteredPasses = passes.filter(pass => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();

    // Check main details
    const matchMain = 
      pass.passNumber.toString().includes(query) ||
      pass.senderName.toLowerCase().includes(query) ||
      (pass.receiverName && pass.receiverName.toLowerCase().includes(query)) ||
      pass.targetUnit.toLowerCase().includes(query);

    // Check items for Order No or Work Order No
    const matchItems = pass.items.some(item => 
      (item.orderNumber && item.orderNumber.toLowerCase().includes(query)) ||
      (item.workOrderNumber && item.workOrderNumber.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    );

    return matchMain || matchItems;
  });

  const isSaved = currentPass && passes.some(p => p.id === currentPass.id);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* Navigation - Hidden on Print */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setView('form')}>
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                 <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">GatePass Pro</h1>
                <p className="text-xs text-slate-500 font-medium">Digital Entry Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => { startNew(); setView('form'); }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'form' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
              >
                New Pass
              </button>
              <button 
                onClick={() => setView('history')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'history' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
              >
                History
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:max-w-none">
        
        {/* Form View */}
        {view === 'form' && (
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Create New Gate Pass</h2>
                <p className="text-slate-500 mt-1">Fill in the details below. ID will be assigned automatically.</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-right">
                <span className="text-xs uppercase font-semibold text-slate-500 block">Next Serial No</span>
                <span className="text-xl font-mono font-bold text-blue-600">#{nextNumber}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200">
              <div className="p-6 space-y-8">
                
                {/* Section 1: Transfer Info */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Transfer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sender Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Sender Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        placeholder="Who is sending?"
                        value={formData.senderName}
                        onChange={e => setFormData({...formData, senderName: e.target.value})}
                      />
                    </div>

                    {/* From Unit */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        From Unit <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        placeholder="Source Dept/Unit"
                        value={formData.fromUnit}
                        onChange={e => setFormData({...formData, fromUnit: e.target.value})}
                      />
                    </div>

                    {/* Receiver Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Receiver Name (Send To) <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        placeholder="Who is receiving?"
                        value={formData.receiverName}
                        onChange={e => setFormData({...formData, receiverName: e.target.value})}
                      />
                    </div>

                    {/* Target Unit (To Unit) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        To Unit <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        placeholder="Destination Unit"
                        value={formData.targetUnit}
                        onChange={e => setFormData({...formData, targetUnit: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Items Table Input */}
                <div>
                   <div className="flex justify-between items-center mb-4">
                     <div>
                       <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Item Details</h3>
                       <p className="text-xs text-slate-500">Add items for this gate pass.</p>
                     </div>
                     <button type="button" onClick={handleAddItem} className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center bg-blue-50 px-3 py-1.5 rounded-md">
                       <Plus className="w-4 h-4 mr-1" /> Add Item Row
                     </button>
                   </div>

                   <div className="space-y-3">
                     {/* Header for Desktop */}
                     <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-2 uppercase">
                       <div className="col-span-2">Order No</div>
                       <div className="col-span-2">Work Order</div>
                       <div className="col-span-4">Description</div>
                       <div className="col-span-2">Order Qty</div>
                       <div className="col-span-2">Deliver Qty</div>
                     </div>

                     {items.map((item, index) => (
                       <div key={item.id} className="relative group bg-white p-4 rounded-lg border border-slate-300 shadow-sm md:p-0 md:bg-transparent md:border-0 md:shadow-none">
                         {/* Mobile Labels are hidden in grid on desktop */}
                         <div className="md:grid md:grid-cols-12 md:gap-2 items-start">
                           
                           {/* Order Number */}
                           <div className="mb-2 md:mb-0 md:col-span-2">
                             <label className="block md:hidden text-xs font-medium text-slate-500 mb-1">Order No</label>
                             <input
                               type="text"
                               className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                               placeholder="Order #"
                               value={item.orderNumber}
                               onChange={e => handleItemChange(item.id, 'orderNumber', e.target.value)}
                             />
                           </div>

                           {/* Work Order */}
                           <div className="mb-2 md:mb-0 md:col-span-2">
                             <label className="block md:hidden text-xs font-medium text-slate-500 mb-1">Work Order</label>
                             <input
                               type="text"
                               className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                               placeholder="WO #"
                               value={item.workOrderNumber}
                               onChange={e => handleItemChange(item.id, 'workOrderNumber', e.target.value)}
                             />
                           </div>

                           {/* Description */}
                           <div className="mb-2 md:mb-0 md:col-span-4">
                             <label className="block md:hidden text-xs font-medium text-slate-500 mb-1">Description</label>
                             <input
                               required
                               type="text"
                               className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                               placeholder="Item Description"
                               value={item.description}
                               onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                             />
                           </div>

                           {/* Order Qty */}
                           <div className="mb-2 md:mb-0 md:col-span-2">
                             <label className="block md:hidden text-xs font-medium text-slate-500 mb-1">Order Qty</label>
                             <input
                               type="number"
                               min="0"
                               className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                               placeholder="Ord Qty"
                               value={item.orderQuantity || ''}
                               onChange={e => handleItemChange(item.id, 'orderQuantity', parseFloat(e.target.value) || 0)}
                             />
                           </div>

                           {/* Deliver Qty */}
                           <div className="flex gap-2 md:col-span-2">
                             <div className="flex-grow">
                               <label className="block md:hidden text-xs font-medium text-slate-500 mb-1">Deliver Qty</label>
                               <input
                                 required
                                 type="number"
                                 min="0"
                                 className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-900 bg-white"
                                 placeholder="Del Qty"
                                 value={item.deliveredQuantity || ''}
                                 onChange={e => handleItemChange(item.id, 'deliveredQuantity', parseFloat(e.target.value) || 0)}
                               />
                             </div>
                             
                             {/* Delete Button */}
                             {items.length > 1 && (
                               <button 
                                 type="button" 
                                 onClick={() => handleRemoveItem(item.id)}
                                 className="md:mt-0.5 p-2 text-slate-400 hover:text-red-500 transition-colors self-end md:self-auto"
                                 title="Remove Row"
                               >
                                 <Trash2 className="w-5 h-5" />
                               </button>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-8 rounded-lg shadow-md transition-all flex items-center text-lg">
                  <CheckCircle className="w-5 h-5 mr-2" /> Generate Pass
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preview View */}
        {view === 'preview' && currentPass && (
          <div className="animate-fade-in">
             <div className="mb-6 flex justify-between items-center no-print max-w-[275mm] mx-auto no-print-container flex-wrap gap-2">
               <button 
                onClick={() => {
                  if(!isSaved) {
                    if(confirm("This pass has not been saved. Discard changes?")) {
                       setView('form');
                    }
                  } else {
                    setView('history');
                    // We don't call startNew() here so the form data persists if they want to create a similar pass
                  }
                }} 
                className="flex items-center text-slate-600 hover:text-slate-900 font-medium"
               >
                 <ArrowLeft className="w-5 h-5 mr-2" /> Back
               </button>
               
               <div className="flex space-x-2 md:space-x-3">
                 <button 
                    onClick={handleDownloadPdf} 
                    disabled={isGeneratingPdf}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 md:px-4 rounded-lg shadow-sm flex items-center disabled:opacity-50 text-sm md:text-base"
                  >
                    <Download className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> 
                    {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                 </button>

                 {!isSaved && (
                    <button 
                      onClick={handleManualSave}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 md:px-4 rounded-lg shadow-sm flex items-center text-sm md:text-base"
                    >
                      <Save className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> Save Record
                    </button>
                 )}

                 <button onClick={handleConfirmAndPrint} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 md:px-4 rounded-lg shadow-sm flex items-center text-sm md:text-base">
                    <Printer className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> Print Gate Pass
                 </button>
               </div>
             </div>

             <div className="flex justify-center">
                 {isSaved ? (
                   <div className="mb-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200 inline-flex items-center">
                     <CheckCircle className="w-3 h-3 mr-1"/> Saved to History
                   </div>
                 ) : (
                    <div className="mb-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200 inline-flex items-center">
                     Pending Save
                   </div>
                 )}
             </div>

             <GatePassTemplate data={currentPass} />
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-slate-900">Pass History</h2>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                    placeholder="Search Order #, Work Order #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button onClick={() => { startNew(); setView('form'); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center transition-colors shadow-sm">
                  <Plus className="w-4 h-4 mr-1"/> Create New
                </button>
              </div>
            </div>

            {filteredPasses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No records found</h3>
                <p className="text-slate-500">{searchQuery ? 'Try adjusting your search terms.' : 'Generate your first gate pass to see it here.'}</p>
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass No</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sender</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">To Unit</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Work Order Details</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredPasses.map((pass) => (
                        <tr key={pass.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-blue-600">#{pass.passNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{new Date(pass.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{pass.senderName}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{pass.targetUnit}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <div className="flex flex-col space-y-1">
                              {pass.items.map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                  <div className="flex items-center space-x-2">
                                     <span className={`text-xs font-bold font-mono ${item.workOrderNumber ? 'text-slate-800' : 'text-slate-400'}`}>
                                       {item.workOrderNumber || 'No WO'}
                                     </span>
                                     {item.orderNumber && (
                                       <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                                         Ord: {item.orderNumber}
                                       </span>
                                     )}
                                  </div>
                                  <span className="text-xs text-slate-500 truncate max-w-[200px]">{item.description}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button 
                              onClick={() => handleViewHistoryItem(pass)}
                              className="text-blue-600 hover:text-blue-900 font-medium text-sm mr-4"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => deletePass(pass.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;