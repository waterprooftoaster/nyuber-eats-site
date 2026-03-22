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
  const cleaned = sanitize(preview)
  const truncated = cleaned.length > 100 ? cleaned.slice(0, 97) + '...' : cleaned
  return `${sanitize(name)}: ${truncated}`
}

export function newMessageFromOrderer(name: string, preview: string): string {
  const cleaned = sanitize(preview)
  const truncated = cleaned.length > 100 ? cleaned.slice(0, 97) + '...' : cleaned
  return `${sanitize(name)}: ${truncated}`
}

export function proxyAcceptedOrderer(swiperName: string): string {
  return `Your order is being prepared by ${sanitize(swiperName)}. Text this number to follow up with your swiper.`
}

export function proxyAcceptedSwiper(): string {
  return "You've accepted an order! Any replies to this number will go to the customer."
}

export function proxyAcceptedSwiperWithEatery(eateryName: string): string {
  return `You've accepted an order from ${sanitize(eateryName)}! Any replies to this number will go to the customer.`
}
