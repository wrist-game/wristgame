/**
 * Turns the settings in src/config/payments.ts into the list of options the
 * checkout shows. Pure functions: no React, no network.
 */
import { payments, type PaymentSettings } from '../../config/payments';
import type { PaymentMethodId, PaymentMethodOption } from './types';

/** The gateway can only be used when it is switched on AND fully configured. */
export function isGatewayReady(settings: PaymentSettings = payments): boolean {
  const { enabled, apiBaseUrl, allowedRedirectHosts } = settings.gateway;
  return enabled && /^https:\/\/[^\s/]+/i.test(apiBaseUrl.trim()) && allowedRedirectHosts.some((host) => host.trim() !== '');
}

export function getPaymentMethods(settings: PaymentSettings = payments): PaymentMethodOption[] {
  const methods: PaymentMethodOption[] = [];
  const { cashOnDelivery: cod, manual, gateway } = settings;

  if (cod.enabled) {
    methods.push({
      id: 'cod',
      kind: 'offline',
      label: cod.label,
      description: cod.description,
      badge: cod.demo ? 'Demo option' : undefined,
      available: true,
      instructions: [],
      details: [],
      messageLabel: cod.demo ? `${cod.label} (demo option, please confirm it is available)` : cod.label,
    });
  }

  if (manual.enabled) {
    methods.push({
      id: 'manual',
      kind: 'offline',
      label: manual.label,
      description: manual.description,
      available: true,
      instructions: manual.instructions.map((line) => line.trim()).filter(Boolean),
      details: manual.details.filter((row) => row.label.trim() !== ''),
      messageLabel: manual.label,
    });
  }

  const gatewayReady = isGatewayReady(settings);
  if (gatewayReady || gateway.showWhenUnavailable) {
    methods.push({
      id: 'online',
      kind: 'gateway',
      label: gateway.label,
      description: gateway.description,
      badge: gatewayReady ? undefined : 'Not available yet',
      available: gatewayReady,
      instructions: [],
      details: [],
      messageLabel: gateway.label,
    });
  }

  return methods;
}

/** The configured default if the customer can choose it, otherwise the first available method. */
export function getDefaultMethodId(methods: PaymentMethodOption[], preferred: string = payments.defaultMethod): PaymentMethodId | null {
  const usable = methods.filter((method) => method.available);
  return (usable.find((method) => method.id === preferred) ?? usable[0])?.id ?? null;
}
