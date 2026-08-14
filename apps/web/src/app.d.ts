declare global {
	namespace App {
		interface Locals {
			session: { workos_id: string; email: string; vault_setup: boolean } | null;
		}
	}
}

export {};
