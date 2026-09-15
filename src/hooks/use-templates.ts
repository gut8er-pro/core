import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type EmailTemplate = {
	id: string
	subject: string
	body: string
	createdAt: string
	updatedAt: string
}

type TemplateInput = {
	subject: string
	body: string
}

const TEMPLATES_KEY = ['settings', 'templates']

async function fetchTemplates(): Promise<EmailTemplate[]> {
	const response = await fetch('/api/settings/templates')
	if (!response.ok) {
		throw new Error('Failed to fetch templates')
	}
	const data: { templates: EmailTemplate[] } = await response.json()
	return data.templates
}

async function createTemplate(input: TemplateInput): Promise<EmailTemplate> {
	const response = await fetch('/api/settings/templates', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!response.ok) {
		const body = await response.json().catch(() => ({}))
		throw new Error(body.error || 'Failed to create template')
	}
	const data: { template: EmailTemplate } = await response.json()
	return data.template
}

async function updateTemplate({
	id,
	...input
}: TemplateInput & { id: string }): Promise<EmailTemplate> {
	const response = await fetch(`/api/settings/templates/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!response.ok) {
		const body = await response.json().catch(() => ({}))
		throw new Error(body.error || 'Failed to update template')
	}
	const data: { template: EmailTemplate } = await response.json()
	return data.template
}

async function deleteTemplate(id: string): Promise<void> {
	const response = await fetch(`/api/settings/templates/${id}`, { method: 'DELETE' })
	if (!response.ok) {
		const body = await response.json().catch(() => ({}))
		throw new Error(body.error || 'Failed to delete template')
	}
}

function useTemplates() {
	return useQuery({
		queryKey: TEMPLATES_KEY,
		queryFn: fetchTemplates,
	})
}

function useCreateTemplate() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createTemplate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY })
		},
	})
}

function useUpdateTemplate() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: updateTemplate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY })
		},
	})
}

function useDeleteTemplate() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: deleteTemplate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY })
		},
	})
}

export type { EmailTemplate, TemplateInput }
export { useCreateTemplate, useDeleteTemplate, useTemplates, useUpdateTemplate }
