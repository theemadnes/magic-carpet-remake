import React, { useRef, useEffect } from 'react';
import { LogMessage } from '../types/game';

interface MessageChronicleProps {
  messages: LogMessage[];
}

export const MessageChronicle: React.FC<MessageChronicleProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getColor = (type: LogMessage['type']) => {
    switch (type) {
      case 'combat': return 'text-[#f87171]';
      case 'mana': return 'text-[#38bdf8]';
      case 'castle': return 'text-[#fde047]';
      case 'cataclysm': return 'text-[#fb923c]';
      case 'rival': return 'text-[#e879f9]';
      default: return 'text-[#f5f5f4]';
    }
  };

  return (
    <div className="w-80 h-28 bg-black/75 border-2 border-[#854d0e] rounded-lg p-2 shadow-2xl backdrop-blur-sm flex flex-col font-serif select-none overflow-hidden">
      <div className="text-[10px] text-[#ca8a04] uppercase font-bold tracking-wider border-b border-[#452709] pb-0.5 mb-1">
        Arcane Realm Chronicle
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 text-xs pr-1 scrollbar-thin">
        {messages.slice(-15).map(msg => (
          <div key={msg.id} className="flex items-start space-x-1 leading-tight">
            <span className="text-[#a8824f] text-[10px]">&gt;</span>
            <span className={`${getColor(msg.type)} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-[11px]`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
