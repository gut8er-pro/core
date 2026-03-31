import { http, HttpResponse } from 'msw'

export const handlers = [
	http.get('/api/notifications', () => {
		return HttpResponse.json({ notifications: [], unreadCount: 0 })
	}),
	http.get('/api/stats', () => {
		return HttpResponse.json({
			totalRevenue: 0,
			completedPayments: 0,
			pendingPayments: 0,
			delayedPayments: 0,
			monthlyRevenue: Array(12).fill(0),
		})
	}),
]
