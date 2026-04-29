/*
## MyToDoReact (Springboot) version 1.0.
##
## Copyright (c) 2022 Oracle, Inc.
## Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl/
*/
/*
 * The swagger definition of the APIs can be found here:
 * https://objectstorage.eu-frankfurt-1.oraclecloud.com/n/oracleonpremjava/b/todolist/o/swagger_APIs_definition.json
 *
 * You can view it in swagger-ui by going to the following petstore swagger ui page and
 * pasting the URL above that points to the definitions of the APIs that are used in this app:
 * https://petstore.swagger.io/
 * @author  jean.de.lavarene@oracle.com
 */
const useMock = process.env.REACT_APP_USE_MOCK === 'true';
const REAL_BASE = '/todolist';

const mockData = [
	{ id: '1', description: 'Conectar backend con la base de datos', done: false, createdAt: new Date().toISOString() },
	{ id: '2', description: 'Poder gestionar Sprints visualmente', done: true, createdAt: new Date().toISOString() }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mockGeneratePlan = async (payload) => {
	await sleep(250);
	const topic = (payload && payload.prompt ? payload.prompt : 'Proyecto').trim();
	const words = topic.split(/\s+/).filter(Boolean);
	const count = Number(payload && payload.taskCount ? payload.taskCount : 6) || 6;
	return Array.from({ length: count }, (_, index) => {
		const label = words[index % words.length] || 'Proyecto';
		return {
			titulo: `${label} - tarea ${index + 1}`,
			descripcion: `Desglosar ${topic.toLowerCase()} en el paso ${index + 1}.`,
			prioridad: index === 0 ? 'HIGH' : 'MEDIUM',
			estimacionHoras: index === 0 ? 4 : 2,
			horasReales: 0,
			idUsuario: payload && payload.defaultUserId != null ? payload.defaultUserId : 1,
			idSprint: payload && payload.defaultSprintId != null ? payload.defaultSprintId : 1,
			idEstado: 1,
			idProyecto: payload && payload.defaultProjectId != null ? payload.defaultProjectId : null
		};
	});
};

const API = {
	list: async () => {
		if (useMock) {
			await sleep(200);
			return mockData.map((item) => ({ ...item }));
		}
		const res = await fetch(REAL_BASE);
		if (!res.ok) throw new Error('Network error');
		return res.json();
	},
	get: async (id) => {
		if (useMock) {
			await sleep(100);
			const found = mockData.find((item) => String(item.id) === String(id));
			if (!found) throw new Error('Not found');
			return { ...found };
		}
		const res = await fetch(`${REAL_BASE}/${id}`);
		if (!res.ok) throw new Error('Network error');
		return res.json();
	},
	create: async (data) => {
		if (useMock) {
			await sleep(150);
			const id = String(Date.now());
			const item = {
				id,
				titulo: data.titulo || data.description || '',
				descripcion: data.descripcion || data.description || '',
				description: data.description || data.descripcion || '',
				prioridad: data.prioridad || null,
				estimacionHoras: data.estimacionHoras || 0,
				horasReales: data.horasReales || 0,
				idUsuario: data.idUsuario || data.userId || null,
				idSprint: data.idSprint || data.sprintId || null,
				idEstado: data.idEstado || 1,
				done: !!data.done,
				createdAt: new Date().toISOString()
			};
			mockData.unshift(item);
			return { ...item };
		}
		const res = await fetch(REAL_BASE, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		if (!res.ok) {
			let message = 'Network error';
			try {
				const text = await res.text();
				if (text) message = text;
			} catch (err) {
				// ignore
			}
			throw new Error(message);
		}
		return res;
	},
	update: async (id, data) => {
		if (useMock) {
			await sleep(120);
			const index = mockData.findIndex((item) => String(item.id) === String(id));
			if (index === -1) throw new Error('Not found');
			mockData[index] = { ...mockData[index], ...data };
			return { ...mockData[index] };
		}
		const res = await fetch(`${REAL_BASE}/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		if (!res.ok) {
			let text = '';
			try { text = await res.text(); } catch (err) { /* ignore */ }
			throw new Error(`Server error ${res.status}: ${text || res.statusText}`);
		}
		return res;
	},
	remove: async (id) => {
		if (useMock) {
			await sleep(80);
			const index = mockData.findIndex((item) => String(item.id) === String(id));
			if (index === -1) throw new Error('Not found');
			mockData.splice(index, 1);
			return { ok: true };
		}
		const res = await fetch(`${REAL_BASE}/${id}`, { method: 'DELETE' });
		if (!res.ok) {
			let text = '';
			try { text = await res.text(); } catch (err) { /* ignore */ }
			throw new Error(`Server error ${res.status}: ${text || res.statusText}`);
		}
		return res;
	},
	generatePlan: async (payload) => {
		if (useMock) {
			return mockGeneratePlan(payload);
		}
		try {
			const res = await fetch('/ai/generate-plan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				if (res.status === 404) {
					return mockGeneratePlan(payload);
				}
				let message = 'Network error';
				try {
					const body = await res.json();
					message = body.message || body.detail || body.error || message;
				} catch (err) {
					message = await res.text();
				}
				throw new Error(message);
			}
			return res.json();
		} catch (error) {
			if (error instanceof TypeError) {
				return mockGeneratePlan(payload);
			}
			throw error;
		}
	}
};

export default API;
