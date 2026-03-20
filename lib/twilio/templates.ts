function sanitize(s: string): string {
  return s.replace(/[\r\n\x00]/g, ' ').trim().slice(0, 50)
}

export function orderAccepted(swiperName: string): string {
  return `${sanitize(swiperName)} accepted your order! They'll start working on it soon.`
}

export function orderInProgress(): string {
  return 'Your food is being ordered now. Hang tight!'
}

export function orderCompleted(): string {
  return 'Your order is ready for pickup!'
}

export function newMessageFromSwiper(name: string, preview: string): string {
  const truncated = preview.length > 100 ? preview.slice(0, 97) + '...' : preview
  return `${sanitize(name)}: ${truncated}`
}

export function newMessageFromOrderer(name: string, preview: string): string {
  const truncated = preview.length > 100 ? preview.slice(0, 97) + '...' : preview
  return `${sanitize(name)}: ${truncated}`
}
