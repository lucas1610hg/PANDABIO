import React, { useState, memo } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Link2,
  Camera,
  MessageCircle,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { BioLink, UserProfile } from '../types';
import { getLinkIconBg } from '../utils/iconMapper';

interface PhonePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  links: BioLink[];
}

export const PhonePreviewModal = memo<PhonePreviewModalProps>(({
  isOpen,
  onClose,
  user,
  links,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(`https://${user.bioUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeLinks = links.filter((l) => l.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/10 flex flex-col max-h-[90vh]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#faf8ff]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-bold text-[#131b2e]">
              Prévia: {user.bioUrl}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-xs text-[#3525cd] hover:bg-[#eaedff] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Copiar link"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smartphone Shell */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-gradient-to-b from-[#FAF7F2] to-[#F2EDE4] flex justify-center">
          <div className="w-full max-w-[320px] bg-white rounded-[38px] shadow-2xl border-4 border-[#12131b] p-4 flex flex-col items-center relative overflow-hidden min-h-[500px]">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-[#12131b] rounded-b-xl mb-3 flex items-center justify-center">
              <div className="w-8 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Profile Avatar */}
            <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#FF7A00] to-[#FF5500] shadow-md mb-2">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover rounded-full bg-white"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-white" />
            </div>

            {/* Name & Bio Title */}
            <h3 className="font-bold text-base text-[#131b2e] tracking-tight text-center">
              {user.pageTitle || user.name}
            </h3>
            <span className="text-xs text-[#FF7A00] font-semibold">
              @{user.username}
            </span>

            {/* Bio Description */}
            {user.bioDescription && (
              <p className="text-[11px] text-gray-600 text-center mt-1.5 px-2 leading-relaxed">
                {user.bioDescription}
              </p>
            )}

            {/* Social Share / Action */}
            <div className="flex items-center gap-2 my-3">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold text-gray-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                <span>Compartilhar</span>
              </button>
            </div>

            {/* Links Stack in Phone */}
            <div className="w-full flex flex-col gap-2 mt-1">
              {activeLinks.length > 0 ? (
                activeLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-[#F6EFE9] hover:bg-[#FF7A00] hover:text-white text-[#131b2e] font-bold text-xs flex items-center justify-between transition-all duration-200 shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="p-1 rounded-lg bg-white group-hover:bg-white/20 transition-colors shrink-0">
                        {(() => {
                          const iconMap = {
                            social: Camera,
                            whatsapp: MessageCircle,
                            portfolio: Layers,
                            store: ShoppingBag,
                            custom: ExternalLink,
                          };
                          const Icon = iconMap[link.type as keyof typeof iconMap] || ExternalLink;
                          return <Icon className="w-4 h-4" />;
                        })()}
                      </span>
                      <span className="truncate">{link.title}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 shrink-0 ml-1" />
                  </a>
                ))
              ) : (
                <div className="p-4 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200 w-full my-2">
                  <Link2 className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs font-semibold text-gray-600">Nenhum link ativo</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Adicione links no painel para exibi-los aqui.</p>
                </div>
              )}
            </div>

            {/* Footer Logo */}
            <div className="mt-auto pt-5 pb-1 flex items-center gap-1 opacity-70">
              <span className="text-[10px] font-medium text-gray-500">Feito com</span>
              <span className="text-[10px] font-bold text-[#FF7A00]">PandaBio 🐼</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isOpen === nextProps.isOpen &&
         prevProps.user.bioUrl === nextProps.user.bioUrl &&
         prevProps.links.length === nextProps.links.length;
});
