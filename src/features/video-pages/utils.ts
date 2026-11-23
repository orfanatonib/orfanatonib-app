export const truncate = (text: string = '', len = 100) =>
  text.length > len ? text.slice(0, len) + '...' : text;

export const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleString('pt-BR') : 'Não disponível';

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const VIDEO_PAGES_LIST_PATH = '/adm/paginas-videos';

export const videoPageEditPath = (id: string) =>
  `/adm/editar-pagina-videos?id=${encodeURIComponent(id)}`;
