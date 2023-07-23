import type { ClientsResponseItem } from "lib/model/Report-v3";
import { get, writable } from "svelte/store";

const clients = writable<ClientsResponseItem[]>([]);

export const setClients = clients.set;

export const Clients = { subscribe: clients.subscribe };

export function getClientIds(item: (string | number)[]): number[] {
  const clients = get(Clients);

  return item
    .map((item) => {
      if (typeof item === "number") {
        return item;
      }
      const client = clients.find(
        (client) => client.name.toLowerCase() === item.toLowerCase(),
      );
      return client.id ?? null;
    })
    .filter((id) => id !== null) as number[];
}
