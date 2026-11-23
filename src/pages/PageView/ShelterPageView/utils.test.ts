import { describe, expect, it } from 'vitest';

import { buildAddressLines, buildMapsUrl, getInitials2 } from './utils';

const address = { street: 'Rua A', number: '10', district: 'Centro', city: 'Recife', state: 'PE', postalCode: '50000-000', complement: ' ap 2 ' };

describe('endereço do abrigo', () => {
  it('monta as linhas legíveis', () => {
    expect(buildAddressLines(address)).toEqual({ line1: 'Rua A, 10', line2: 'Centro · Recife - PE', postalCode: '50000-000', complement: 'ap 2' });
  });
  it('sem número, não deixa vírgula sobrando', () => {
    expect(buildAddressLines({ ...address, number: undefined }).line1).toBe('Rua A');
  });
  it('link do mapa com o endereço codificado', () => {
    expect(buildMapsUrl(address)).toBe('https://www.google.com/maps/search/?api=1&query=Rua%20A%2C%2010%2C%20Centro%2C%20Recife%2C%20PE');
  });
  it('iniciais', () => {
    expect(getInitials2('Maria da Silva')).toBe('MS');
  });
});
