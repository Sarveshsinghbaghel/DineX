import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as restaurantService from '../services/restaurant.service';
import { getEffectiveSettings } from '../../settings/services/settings.service';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  restaurantStatusSchema,
  weeklyBusinessHoursSchema,
  restaurantQuerySchema,
} from '@x10think/validation';

export async function createRestaurant(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createRestaurantSchema.parse(request.body);
    const restaurant = await restaurantService.createRestaurant(body, request.user!);
    sendSuccessResponse(response, {
      statusCode: 201,
      message: 'Restaurant created successfully.',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRestaurant(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurant = await restaurantService.getRestaurantById(
      request.params.restaurantId as string,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Restaurant retrieved successfully.',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRestaurant(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = updateRestaurantSchema.parse(request.body);
    const updated = await restaurantService.updateRestaurant(
      request.params.restaurantId as string,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Restaurant updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRestaurantStatus(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = restaurantStatusSchema.parse(request.body);
    const updated = await restaurantService.updateRestaurantStatus(
      request.params.restaurantId as string,
      body.status,
      body.reason,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Restaurant status updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusinessHours(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurant = await restaurantService.getRestaurantById(
      request.params.restaurantId as string,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Business hours retrieved successfully.',
      data: restaurant.businessHours ?? [],
    });
  } catch (error) {
    next(error);
  }
}

export async function replaceBusinessHours(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = weeklyBusinessHoursSchema.parse(request.body);
    const updatedHours = await restaurantService.replaceBusinessHours(
      request.params.restaurantId as string,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Business hours updated successfully.',
      data: updatedHours,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRestaurantSettings(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurant = await restaurantService.getRestaurantById(
      request.params.restaurantId as string,
      request.user!,
    );
    const settings = await getEffectiveSettings(restaurant.tenantId);
    sendSuccessResponse(response, {
      message: 'Restaurant settings retrieved successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRestaurantSettings(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settings = await restaurantService.updateRestaurantSettings(
      request.params.restaurantId as string,
      request.body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Restaurant settings updated successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function listRestaurants(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = restaurantQuerySchema.parse(request.query);
    const result = await restaurantService.listRestaurants(query, request.user!);
    sendSuccessResponse(response, {
      message: 'Restaurants listed successfully.',
      data: result.restaurants,
    });
  } catch (error) {
    next(error);
  }
}
