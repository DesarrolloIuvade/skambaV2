import { skambaMiembrosProyecto } from './api';
import type { Miembro } from './types/grupo';

/**
 * Returns the members assigned to a project/list using the backend view.
 */
export async function getProjectMembers(
  _token: string,
  proIde: string | number,
): Promise<Miembro[]> {
  try {
    const response = await skambaMiembrosProyecto('', Number(proIde));
    const members = Array.isArray(response.data) ? response.data : [];

    return members.map((member) => ({
      ...member,
      usu_ide: Number(member.usu_ide),
      g_e_ide: Number(member.g_e_ide ?? 0),
    }));
  } catch (error) {
    console.warn('Error fetching project members:', error);
    return [];
  }
}
