import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, PawPrint } from 'lucide-react';
import { PagePreview } from './PagePreview';
import { PageService } from '../supabase/services/pageService';
import { PageBlock, PageData } from '../types';
import { PublicAnalyticsService } from '../supabase/services/publicAnalyticsService';
import { PublicBookingModal } from './PublicBookingModal';
import { PublicAvailabilityService } from '../supabase/services/agendamentoService';
import { PublicBookingAvailability } from '../types_agendamentos';

interface PublicProfilePageProps {
  username: string;
}

export function PublicProfilePage({ username }: PublicProfilePageProps) {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingBlock, setBookingBlock] = useState<PageBlock | null>(null);
  const [bookingAvailability, setBookingAvailability] = useState<PublicBookingAvailability[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      const result = await PageService.loadPublicPageData(username);
      if (!mounted) return;

      if (!result.success || !result.pageData) {
        setError(result.error || 'Página não encontrada');
        return;
      }

      setPageData(result.pageData);
      result.pageData.blocks
        .filter((block) => block.type === 'contact' && block.contact?.captureEnabled)
        .forEach((block) => {
          void PublicAnalyticsService.track(username, 'form_view', block.id);
        });
       result.pageData.blocks
         .filter((block) => block.type === 'produto')
         .forEach((block) => {
           block.products?.forEach((product) => {
             void PublicAnalyticsService.track(username, 'product_view', product.id);
           });
         });
       const hasBookingBlock = result.pageData.blocks.some((block) => block.type === 'agendamento');
      if (result.pageData.bookingWorkspaceSlug && hasBookingBlock) {
        void PublicAvailabilityService.getPublicAvailability(
          result.pageData.bookingWorkspaceSlug,
        ).then((availability) => {
          if (mounted) setBookingAvailability(availability);
        });
      } else {
        setBookingAvailability([]);
      }
      void PublicAnalyticsService.track(username, 'view');
      const title = result.pageData.profile.pageTitle || result.pageData.profile.name;
      const description =
        result.pageData.profile.bioDescription || `Página pública de @${username}`;
      const image = result.pageData.profile.coverUrl || result.pageData.profile.avatarUrl;
      document.title = title;

      const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
        let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attribute, key);
          document.head.appendChild(element);
        }
        element.content = content;
      };

      setMeta('name', 'description', description);
      setMeta('property', 'og:title', title);
      setMeta('property', 'og:description', description);
      setMeta('property', 'og:url', window.location.href);
      setMeta('property', 'og:type', 'profile');
      if (image) setMeta('property', 'og:image', image);
      setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
      setMeta('name', 'twitter:title', title);
      setMeta('name', 'twitter:description', description);
    };

    void loadPage();

    return () => {
      mounted = false;
    };
  }, [username]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#f6efe9] px-5 py-10 text-[#131b2e] flex items-center justify-center">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-[#FF7A00]" aria-hidden="true" />
          <h1 className="text-xl font-extrabold">Página não encontrada</h1>
          <p className="mt-2 text-sm text-[#464555]">{error}</p>
          <a
            href="/"
            className="mt-6 inline-flex rounded-xl bg-[#131b2e] px-4 py-2.5 text-sm font-bold text-white"
          >
            Ir para PandaBio
          </a>
        </section>
      </main>
    );
  }

  if (!pageData) {
    return (
      <main className="min-h-screen bg-[#f6efe9] flex items-center justify-center text-[#464555]">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF7A00]" aria-label="Carregando página" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6efe9] px-3 py-5 sm:px-5 sm:py-10">
      <div className="mx-auto w-full max-w-[640px]">
        <PagePreview
          profile={pageData.profile}
          theme={pageData.theme}
          blocks={pageData.blocks}
          forms={pageData.forms}
          links={pageData.links}
          device="desktop"
          interactive
          bookingAvailability={bookingAvailability}
          onInteractiveClick={(block, targetId) => {
            const eventType =
              block.type === 'produto'
                ? 'product_click'
                : block.type === 'agendamento'
                  ? 'booking_start'
                  : block.type === 'contact'
                    ? 'whatsapp_click'
                : block.type === 'social'
                      ? 'social_click'
                      : block.type === 'location'
                        ? 'location_click'
                       : 'link_click';
             void PublicAnalyticsService.track(
               username,
               eventType,
               targetId || block.id,
             );
            if (block.type === 'agendamento') setBookingBlock(block);
          }}
          onLeadCapture={async (block, input) => {
            const result = await PublicAnalyticsService.captureLead(username, {
              ...input,
              customData: input.fields,
              relatedName: block.title || block.contact?.captureTitle,
            });
            if (result.success) {
              void PublicAnalyticsService.track(username, 'form_submit', block.id);
            }
            return result;
          }}
        />
        {bookingBlock && (
          <PublicBookingModal
            workspaceSlug={pageData.bookingWorkspaceSlug}
            title={bookingBlock.appointmentTitle || bookingBlock.title}
            onClose={() => setBookingBlock(null)}
          />
        )}
        <div className="flex items-center justify-center gap-1.5 py-4 text-[10px] text-[#777481]">
          <PawPrint className="h-3 w-3" aria-hidden="true" />
          <span className="font-semibold">PandaBio</span>
        </div>
      </div>
    </main>
  );
}
