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
// API wrapper that calls the real backend endpoints.
// Base path for todo items
const REAL_BASE = '/todolist';

const API = {
	list: async () => {
		const res = await fetch(REAL_BASE);
		if (!res.ok) throw new Error('Network error');
		return res.json();
	},
	get: async (id) => {
		const res = await fetch(`${REAL_BASE}/${id}`);
		if (!res.ok) throw new Error('Network error');
		return res.json();
	},
	create: async (data) => {
		const res = await fetch(REAL_BASE, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		if (!res.ok) {
			let text = '';
			try { text = await res.text(); } catch(e) { /* ignore */ }
			throw new Error(`Server error ${res.status}: ${text || res.statusText}`);
		}
		return res;
	},
	update: async (id, data) => {
		const res = await fetch(`${REAL_BASE}/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		if (!res.ok) {
			let text = '';
			try { text = await res.text(); } catch(e) {}
			throw new Error(`Server error ${res.status}: ${text || res.statusText}`);
		}
		return res;
	},
	remove: async (id) => {
		const res = await fetch(`${REAL_BASE}/${id}`, { method: 'DELETE' });
		if (!res.ok) {
			let text = '';
			try { text = await res.text(); } catch(e) {}
			throw new Error(`Server error ${res.status}: ${text || res.statusText}`);
		}
		return res;
	}
};

export default API;