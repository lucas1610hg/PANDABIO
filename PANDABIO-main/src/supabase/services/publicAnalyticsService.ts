import { isSupabaseConfigured, supabase } from '../client';
import { ProfileService } from './profileService';
import { TrackingEventType } from '../../types';

export interface PublicAnalyticsEvent {
  eventType: TrackingEventType;
  targetId: string | null;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  referrer: string | null;
  visitorId?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  landingPage?: string | null;
  createdAt: string;
}

export interface PublicAnalyticsSale {
  productId: string;
  quantity: number;
  amount: number | null;
  createdAt: string;
}

export interface PublicAnalyticsSummary {
  visits: number;
  clicks: number;
  uniqueVisitors: number;
  events: PublicAnalyticsEvent[];
  sales: PublicAnalyticsSale[];
  salesAvailable: boolean;
}

export interface PublicLeadCaptureInput {
  name: string;
  email: string;
  phone?: string;
  consent: boolean;
  relatedName?: string;
  customData?: Record<string, string>;
}

export interface PublicLeadCaptureResult {
  success: boolean;
  error?: string;
}

export const TRACKING_EVENT_TYPES: TrackingEventType[] = [
  'view',
  'click',
  'page_view',
  'link_click',
  'product_view',
  'product_click',
  'service_view',
  'booking_start',
  'booking_completed',
  'form_view',
  'form_submit',
  'whatsapp_click',
  'phone_click',
  'email_click',
  'social_click',
  'conversion',
];

type PublicEventType = TrackingEventType;

export function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate.code === 'string' ? candidate.code : '';
  const message = typeof candidate.message === 'string' ? candidate.message : '';

  return (
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    code === 'PGRST204' ||
    /relation .* does not exist/i.test(message) ||
    /column .* does not exist/i.test(message) ||
    /public_page_events|record_public_page_event/i.test(message)
  );
}

export class PublicAnalyticsService {
  private static readonly trackedViews = new Set<string>();
  private static readonly pendingViews = new Set<string>();
  private static visitorId: string | null = null;

  static async track(
    username: string,
    eventType: PublicEventType,
    targetId?: string,
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    const normalizedUsername = username.trim().toLowerCase();
    if (eventType === 'view') {
      if (this.trackedViews.has(normalizedUsername) || this.pendingViews.has(normalizedUsername)) {
        return true;
      }
      this.pendingViews.add(normalizedUsername);
    }

    try {
      const trackingContext = this.getTrackingContext();
      const payload = {
        p_username: normalizedUsername,
        p_event_type: eventType,
        p_target_id: targetId || null,
        p_device_type: this.getDeviceType(),
        p_referrer: trackingContext.referrer,
        p_visitor_id: this.getVisitorId(),
        p_source: trackingContext.source,
        p_medium: trackingContext.medium,
        p_campaign: trackingContext.campaign,
        p_landing_page: trackingContext.landingPage,
        p_metadata: { trackedAt: new Date().toISOString() },
      };
      let { error } = await supabase.rpc('record_public_page_event', payload);

      if (error) {
        const legacyResult = await supabase.rpc('record_public_page_event', {
          p_username: payload.p_username,
          p_event_type: payload.p_event_type === 'view' ? 'view' : 'click',
          p_target_id: payload.p_target_id,
          p_device_type: payload.p_device_type,
          p_referrer: payload.p_referrer,
          p_visitor_id: payload.p_visitor_id,
        });
        error = legacyResult.error;
        if (error) {
          const oldestResult = await supabase.rpc('record_public_page_event', {
            p_username: payload.p_username,
            p_event_type: payload.p_event_type === 'view' ? 'view' : 'click',
            p_target_id: payload.p_target_id,
            p_device_type: payload.p_device_type,
            p_referrer: payload.p_referrer,
          });
          error = oldestResult.error;
        }
      }
      if (error) throw error;
      if (eventType === 'view') this.trackedViews.add(normalizedUsername);
      return true;
    } catch (error) {
      if (!isMissingRelationError(error)) {
        console.error('Error tracking public page event:', error);
      }
      return false;
    } finally {
      if (eventType === 'view') this.pendingViews.delete(normalizedUsername);
    }
  }

  static async captureLead(
    username: string,
    input: PublicLeadCaptureInput,
  ): Promise<PublicLeadCaptureResult> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Captura de leads indisponível no momento.' };
    }
    if (!input.consent || !input.name.trim() || !input.email.trim()) {
      return { success: false, error: 'Informe nome, e-mail e aceite o consentimento.' };
    }

    try {
      const trackingContext = this.getTrackingContext();
      const payload = {
        p_username: username.trim().toLowerCase(),
        p_name: input.name.trim(),
        p_email: input.email.trim().toLowerCase(),
        p_phone: input.phone?.trim() || null,
        p_consent: input.consent,
        p_visitor_id: this.getVisitorId(),
        p_device_type: this.getDeviceType(),
        p_source: trackingContext.source,
        p_medium: trackingContext.medium,
        p_campaign: trackingContext.campaign,
        p_referrer: trackingContext.referrer,
        p_landing_page: trackingContext.landingPage,
        p_related_name: input.relatedName?.trim() || null,
        p_custom_data: input.customData || {},
      };
      let { error } = await supabase.rpc('capture_public_lead', payload);
      if (error && isMissingRelationError(error)) {
        const legacyPayload = { ...payload };
        delete legacyPayload.p_custom_data;
        const legacyResult = await supabase.rpc('capture_public_lead', legacyPayload);
        error = legacyResult.error;
      }

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error capturing public lead:', error);
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : '';
      const publicMessage = /consentimento|dados de contato|e-mail inválido|página pública/i.test(
        message,
      )
        ? message
        : 'Não foi possível salvar seus dados. Tente novamente.';
      return { success: false, error: publicMessage };
    }
  }

  static async getSummary(): Promise<PublicAnalyticsSummary> {
    if (!isSupabaseConfigured() || !supabase) return this.emptySummary();

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return this.emptySummary();

      type RawPublicEvent = {
        event_type: TrackingEventType;
        target_id?: string | null;
        link_id?: string | null;
        device_type: 'mobile' | 'desktop' | 'tablet';
        referrer: string | null;
        visitor_id?: string | null;
        source?: string | null;
        medium?: string | null;
        campaign?: string | null;
        landing_page?: string | null;
        created_at: string;
      };
      const initialResult = await supabase
        .from('public_page_events')
        .select(
          'event_type, target_id, device_type, referrer, visitor_id, source, medium, campaign, landing_page, created_at',
        )
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true });
      let data = initialResult.data as RawPublicEvent[] | null;
      let error = initialResult.error;

      let hasVisitorColumn = true;
      if (error) {
        if (isMissingRelationError(error)) {
          const legacyResult = await supabase
            .from('analytics')
            .select('event_type, link_id, device_type, referrer, created_at')
            .eq('profile_id', profileId)
            .in('event_type', ['view', 'click'])
            .order('created_at', { ascending: true });

          if (legacyResult.error) {
            if (isMissingRelationError(legacyResult.error)) return this.emptySummary();
            throw legacyResult.error;
          }

          data = legacyResult.data as RawPublicEvent[] | null;
          hasVisitorColumn = false;
          error = null;
        } else {
          hasVisitorColumn = false;
          const legacyResult = await supabase
            .from('public_page_events')
            .select('event_type, target_id, device_type, referrer, created_at')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: true });
          data = legacyResult.data as RawPublicEvent[] | null;
          error = legacyResult.error;
        }
      }
      if (error) throw error;

      const events: PublicAnalyticsEvent[] = (data || [])
        .filter((event): event is RawPublicEvent => TRACKING_EVENT_TYPES.includes(event.event_type))
        .map((event) => ({
          eventType: event.event_type,
          targetId: event.target_id ?? event.link_id ?? null,
          deviceType: event.device_type,
          referrer: event.referrer,
          visitorId: hasVisitorColumn ? event.visitor_id : null,
          source: event.source ?? null,
          medium: event.medium ?? null,
          campaign: event.campaign ?? null,
          landingPage: event.landing_page ?? null,
          createdAt: event.created_at,
        }));

      const salesResult = await supabase
        .from('product_sales')
        .select('product_id, quantity, amount, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true });
      const salesAvailable = !salesResult.error;
      const sales: PublicAnalyticsSale[] = salesAvailable
        ? (salesResult.data || []).map((sale) => ({
            productId: sale.product_id,
            quantity: sale.quantity,
            amount: sale.amount,
            createdAt: sale.created_at,
          }))
        : [];
      const uniqueVisitorIds = new Set(
        events
          .filter((event) => event.eventType === 'view' || event.eventType === 'page_view')
          .map((event) => event.visitorId),
      );
      uniqueVisitorIds.delete(null);
      const visits = events.filter(
        (event) => event.eventType === 'view' || event.eventType === 'page_view',
      ).length;

      return {
        visits,
        clicks: events.filter(
          (event) => event.eventType === 'click' || event.eventType === 'link_click',
        ).length,
        uniqueVisitors: uniqueVisitorIds.size || visits,
        events,
        sales,
        salesAvailable,
      };
    } catch (error) {
      if (!isMissingRelationError(error)) {
        console.error('Error loading public page analytics:', error);
      }
      return this.emptySummary();
    }
  }

  private static emptySummary(): PublicAnalyticsSummary {
    return {
      visits: 0,
      clicks: 0,
      uniqueVisitors: 0,
      events: [],
      sales: [],
      salesAvailable: false,
    };
  }

  private static getVisitorId(): string | null {
    if (this.visitorId) return this.visitorId;

    this.visitorId =
      typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return this.visitorId;
  }

  private static getTrackingContext(): {
    referrer: string | null;
    source: string | null;
    medium: string | null;
    campaign: string | null;
    landingPage: string | null;
  } {
    if (typeof window === 'undefined') {
      return { referrer: null, source: null, medium: null, campaign: null, landingPage: null };
    }

    const currentUrl = new URL(window.location.href);
    const referrer = document.referrer || null;
    const source = currentUrl.searchParams.get('utm_source') || this.sourceFromReferrer(referrer);
    const medium = currentUrl.searchParams.get('utm_medium');
    const campaign = currentUrl.searchParams.get('utm_campaign');

    return {
      referrer,
      source,
      medium,
      campaign,
      landingPage: `${currentUrl.pathname}${currentUrl.search}`.slice(0, 2048),
    };
  }

  private static sourceFromReferrer(referrer: string | null): string | null {
    if (!referrer) return null;
    try {
      const hostname = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
      if (hostname.includes('instagram')) return 'Instagram';
      if (hostname.includes('facebook')) return 'Facebook';
      if (hostname.includes('tiktok')) return 'TikTok';
      if (hostname.includes('whatsapp')) return 'WhatsApp';
      if (hostname.includes('google')) return 'Google';
      return hostname;
    } catch {
      return null;
    }
  }

  private static getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    if (typeof navigator === 'undefined') return 'desktop';
    if (/tablet|ipad|playbook|silk/i.test(navigator.userAgent)) return 'tablet';
    if (/mobile|android|iphone|ipod/i.test(navigator.userAgent)) return 'mobile';
    return 'desktop';
  }
}
