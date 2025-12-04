import React from 'react';
import { GatePassData } from '../types';

interface GatePassTemplateProps {
  data: GatePassData;
  companyName?: string;
  companyAddress?: string;
}

export const GatePassTemplate: React.FC<GatePassTemplateProps> = ({ 
  data, 
  companyName = "AGHA NOOR",
  companyAddress = "123 Industrial Estate, Tech City, Sector 7"
}) => {
  const formattedDate = new Date(data.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(data.createdAt).toLocaleTimeString();

  return (
    <div id="gate-pass-content" className="bg-white p-6 mx-auto w-full max-w-[275mm] border border-gray-300 shadow-sm print:shadow-none print:border-0 print:p-0 print:w-full print:max-w-none">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-2 mb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900">{companyName}</h1>
        <p className="text-gray-600 text-xs mt-1">{companyAddress}</p>
        <div className="mt-2 inline-block border-2 border-gray-900 px-4 py-0.5">
          <h2 className="text-lg font-bold uppercase tracking-widest">Material Gate Pass</h2>
        </div>
      </div>

      {/* Info Grid - Top Row */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
        <div className="flex flex-col">
          <span className="text-gray-500 text-[10px] uppercase font-semibold">Gate Pass No.</span>
          <span className="text-xl font-mono font-bold text-red-600">GP-{data.passNumber}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-gray-500 text-[10px] uppercase font-semibold">Date & Time</span>
          <span className="font-medium text-sm">{formattedDate} <span className="text-gray-400">|</span> {formattedTime}</span>
        </div>
      </div>

      {/* From / To Sections - Compact */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Transfer From */}
        <div className="border border-gray-300 p-0">
           <div className="bg-white p-1 border-b border-gray-300">
             <h3 className="text-gray-900 text-xs uppercase font-bold text-center">Transfer From</h3>
           </div>
           <div className="p-3 grid grid-cols-1 gap-2">
              <div>
                <span className="text-gray-500 text-[9px] uppercase font-semibold block mb-0.5">Sender Name</span>
                <span className="font-semibold text-base text-gray-900 block border-b border-dotted border-gray-400 pb-0.5">{data.senderName}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[9px] uppercase font-semibold block mb-0.5">From Unit</span>
                <span className="font-semibold text-base text-gray-900 block border-b border-dotted border-gray-400 pb-0.5">{data.fromUnit || '-'}</span>
              </div>
           </div>
        </div>

        {/* Transfer To */}
        <div className="border border-gray-300 p-0">
          <div className="bg-white p-1 border-b border-gray-300">
             <h3 className="text-gray-900 text-xs uppercase font-bold text-center">Transfer To</h3>
           </div>
           <div className="p-3 grid grid-cols-1 gap-2">
              <div>
                <span className="text-gray-500 text-[9px] uppercase font-semibold block mb-0.5">Send To Name</span>
                <span className="font-semibold text-base text-gray-900 block border-b border-dotted border-gray-400 pb-0.5">{data.receiverName || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[9px] uppercase font-semibold block mb-0.5">To Unit</span>
                <span className="font-semibold text-base text-gray-900 block border-b border-dotted border-gray-400 pb-0.5">{data.targetUnit}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="text-gray-800">
              <th className="border border-gray-300 px-2 py-1.5 text-center w-10 font-bold">S.No</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-24 font-bold">Order No.</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-24 font-bold">Work Order</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Description</th>
              <th className="border border-gray-300 px-2 py-1.5 text-right w-20 font-bold">Order Qty</th>
              <th className="border border-gray-300 px-2 py-1.5 text-right w-20 font-bold">Deliver Qty</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="">
                <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                <td className="border border-gray-300 px-2 py-2 font-mono">{item.orderNumber || '-'}</td>
                <td className="border border-gray-300 px-2 py-2 font-mono">{item.workOrderNumber || '-'}</td>
                <td className="border border-gray-300 px-2 py-2 font-medium">{item.description}</td>
                <td className="border border-gray-300 px-2 py-2 text-right text-gray-500">{item.orderQuantity}</td>
                <td className="border border-gray-300 px-2 py-2 text-right font-bold text-gray-900">{item.deliveredQuantity}</td>
              </tr>
            ))}
            {/* Empty rows filler for aesthetics if list is short to maintain height */}
            {data.items.length < 5 && Array.from({ length: 5 - data.items.length }).map((_, i) => (
               <tr key={`empty-${i}`}>
               <td className="border border-gray-300 px-2 py-2 text-center text-transparent">.</td>
               <td className="border border-gray-300 px-2 py-2"></td>
               <td className="border border-gray-300 px-2 py-2"></td>
               <td className="border border-gray-300 px-2 py-2"></td>
               <td className="border border-gray-300 px-2 py-2"></td>
               <td className="border border-gray-300 px-2 py-2"></td>
             </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-8 pt-2">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center justify-end h-24">
            <div className="w-full border-b border-gray-400 border-dashed mb-1"></div>
            <span className="text-[10px] font-bold uppercase text-gray-600">Sender's Signature</span>
          </div>
          <div className="flex flex-col items-center justify-end h-24">
            <div className="w-full border-b border-gray-400 border-dashed mb-1"></div>
            <span className="text-[10px] font-bold uppercase text-gray-600">Authorized By (Security)</span>
          </div>
          <div className="flex flex-col items-center justify-end h-24">
            <div className="w-full border-b border-gray-400 border-dashed mb-1"></div>
            <span className="text-[10px] font-bold uppercase text-gray-600">Receiver's Signature</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-[9px] text-gray-400">Generated via GatePass Pro • {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};