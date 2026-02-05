import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

export const getEventStatus = (dateISO: string) => {
    const eventoDate = dayjs(dateISO);
    const hoje = dayjs();
    const diffDays = eventoDate.diff(hoje, 'day');

    if (eventoDate.isSame(hoje, 'day')) return 'hoje';
    if (diffDays === 1) return 'amanha';
    if (diffDays >= 2 && diffDays <= 7) return 'semana';
    if (diffDays >= 8 && diffDays <= 30) return 'mes';
    if (diffDays > 30) return 'futuro';
    if (diffDays === -1) return 'ontem';
    if (diffDays >= -7 && diffDays <= -2) return 'semana_passada';
    if (diffDays >= -30 && diffDays <= -8) return 'mes_passado';
    return 'antigo';
};

export const createEventArrangement = (eventos: any[]) => {
    const hoje = dayjs();

    const eventosHoje = eventos.filter(e => dayjs(e.date).isSame(hoje, 'day'));
    const eventosFuturos = eventos.filter(e => dayjs(e.date).isAfter(hoje, 'day'));
    const eventosPassados = eventos.filter(e => dayjs(e.date).isBefore(hoje, 'day'));

    const eventosFuturosOrdenados = eventosFuturos.sort((a, b) =>
        dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );

    const eventosPassadosOrdenados = eventosPassados.sort((a, b) =>
        dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    );

    const arrangement = {
        temHoje: eventosHoje.length > 0,
        temPassado: eventosPassadosOrdenados.length > 0,
        temFuturo: eventosFuturosOrdenados.length > 0,
        eventoHoje: eventosHoje[0] || null,
        eventoAnterior: eventosPassadosOrdenados[0] || null,
        proximoEvento: eventosFuturosOrdenados[0] || null,
        segundoFuturo: eventosFuturosOrdenados[1] || null,
        terceiroFuturo: eventosFuturosOrdenados[2] || null,
        eventosRestantes: eventosFuturosOrdenados.slice(3),
        eventosAntigosRestantes: eventosPassadosOrdenados.slice(1),
    };

    return arrangement;
};

export const getLayoutConfig = (arrangement: any) => {
    const { temHoje, temPassado, temFuturo, proximoEvento, segundoFuturo, terceiroFuturo } = arrangement;

    if (temHoje) {
        if (temPassado && temFuturo) {
            return {
                type: 'today_with_past_future',
                slots: [
                    { type: 'anterior', event: arrangement.eventoAnterior, label: 'Evento Anterior' },
                    { type: 'hoje', event: arrangement.eventoHoje, label: 'Evento de Hoje', priority: 'high' },
                    { type: 'proximo', event: proximoEvento, label: 'Próximo Evento' }
                ]
            };
        } else if (temPassado && !temFuturo) {
            return {
                type: 'today_with_past_only',
                slots: [
                    { type: 'anterior', event: arrangement.eventoAnterior, label: 'Evento Anterior' },
                    { type: 'hoje', event: arrangement.eventoHoje, label: 'Evento de Hoje', priority: 'high' }
                ]
            };
        } else if (!temPassado && temFuturo) {
            return {
                type: 'today_with_future_only',
                slots: [
                    { type: 'hoje', event: arrangement.eventoHoje, label: 'Evento de Hoje', priority: 'high' },
                    { type: 'proximo', event: proximoEvento, label: 'Próximo Evento' }
                ]
            };
        } else {
            return {
                type: 'today_only',
                slots: [
                    { type: 'hoje', event: arrangement.eventoHoje, label: 'Evento de Hoje', priority: 'high' }
                ]
            };
        }
    } else {
        if (temPassado && temFuturo) {
            if (segundoFuturo) {
                return {
                    type: 'no_today_with_past_two_future',
                    slots: [
                        { type: 'anterior', event: arrangement.eventoAnterior, label: 'Evento Anterior' },
                        { type: 'proximo', event: proximoEvento, label: 'Próximo Evento' },
                        { type: 'posterior', event: segundoFuturo, label: 'Evento Posterior' }
                    ]
                };
            } else {
                return {
                    type: 'no_today_with_past_one_future',
                    slots: [
                        { type: 'anterior', event: arrangement.eventoAnterior, label: 'Evento Anterior' },
                        { type: 'proximo', event: proximoEvento, label: 'Próximo Evento' }
                    ]
                };
            }
        } else if (!temPassado && temFuturo) {
            if (segundoFuturo && terceiroFuturo) {
                return {
                    type: 'no_today_three_future',
                    slots: [
                        { type: 'proximo', event: proximoEvento, label: 'Próximo Evento' },
                        { type: 'posterior', event: segundoFuturo, label: 'Evento Posterior' },
                        { type: 'terceiro', event: terceiroFuturo, label: 'Próximo Evento' }
                    ]
                };
            } else if (segundoFuturo) {
                return {
                    type: 'no_today_two_future',
                    slots: [
                        { type: 'proximo', event: proximoEvento, label: 'Próximo Evento' },
                        { type: 'posterior', event: segundoFuturo, label: 'Evento Posterior' }
                    ]
                };
            } else {
                return {
                    type: 'no_today_one_future',
                    slots: [
                        { type: 'proximo', event: proximoEvento, label: 'Próximo Evento' }
                    ]
                };
            }
        } else if (temPassado && !temFuturo) {
            return {
                type: 'no_today_past_only',
                slots: [
                    { type: 'anterior', event: arrangement.eventoAnterior, label: 'Evento Anterior' }
                ]
            };
        }
    }

    return {
        type: 'empty',
        slots: []
    };
};
