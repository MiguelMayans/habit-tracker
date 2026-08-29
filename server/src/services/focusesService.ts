import * as focusesRepository from "../repositories/focusesRepository.js";
import type {
  CreateFocusData,
  Focus,
} from "../repositories/focusesRepository.js";
import { getCategoryById } from "../repositories/categoriesRepository.js";

/**
 * Regla de negocio incumplida por los datos de entrada. La ruta la traduce a un
 * 400: es culpa del cliente, no un fallo del servidor.
 */
export class FocusValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FocusValidationError";
  }
}

/**
 * Crea un Foco. Si viene con padre, aplica la regla de "gemado" de
 * docs/DESIGN.md: solo un Foco ya congelado (nivel 20, trofeo de maestría)
 * puede generar un hijo más especializado.
 */
export async function createFocus(data: CreateFocusData): Promise<Focus> {
  // Sin esto la FK de la BBDD salta como error de constraint y acabaría en un
  // 500, cuando en realidad es un dato mal enviado por el cliente.
  const category = await getCategoryById(data.categoryId);
  if (!category) {
    throw new FocusValidationError(
      `La categoría ${data.categoryId} no existe`,
    );
  }

  if (data.parentFocusId !== undefined) {
    const parent = await focusesRepository.getFocusById(data.parentFocusId);

    if (!parent) {
      throw new FocusValidationError(
        `El foco padre ${data.parentFocusId} no existe`,
      );
    }

    if (!parent.frozen) {
      throw new FocusValidationError(
        "El foco padre debe estar congelado (nivel 20) para poder generar un hijo",
      );
    }

    // Un hijo es una especialización del padre, así que vive en su misma
    // categoría. Sin esto la rama quedaría partida entre dos categorías.
    if (parent.categoryId !== data.categoryId) {
      throw new FocusValidationError(
        `Un foco hijo debe pertenecer a la misma categoría que su padre: ` +
          `el padre ${parent.id} está en la categoría ${parent.categoryId}, ` +
          `pero se ha enviado la categoría ${data.categoryId}`,
      );
    }
  }

  return focusesRepository.createFocus(data);
}
