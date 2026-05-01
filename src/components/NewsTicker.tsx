/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface NewsTickerProps {
  news: string[];
}

export function NewsTicker({ news }: NewsTickerProps) {
  const latestMessage = news[news.length - 1] || "Awaiting intelligence reports...";

  return (
    <div className="bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-2 md:p-3 overflow-hidden fixed bottom-16 md:bottom-0 left-0 md:left-20 right-0 z-40">
      <div className="flex items-center gap-3 max-w-7xl mx-auto overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-1.5 text-red-500 font-black text-[10px] md:text-xs uppercase px-2 py-1 bg-red-950/20 rounded-md border border-red-900/30">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> FLASH
        </div>
        
        <div className="flex-1 overflow-hidden pointer-events-none group">
          <motion.div
            key={latestMessage}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              duration: 15, 
              repeat: 2, 
              ease: "linear" 
            }}
            className="whitespace-nowrap text-[11px] md:text-sm font-mono tracking-tight text-blue-400 uppercase italic flex items-center gap-8"
          >
            <span>{latestMessage}</span>
            <span className="text-slate-700">•</span>
            <span>{latestMessage}</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
