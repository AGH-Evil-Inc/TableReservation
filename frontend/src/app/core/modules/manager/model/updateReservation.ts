/**
 * Manager API
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface UpdateReservation { 
    /**
     * ID of the Reservation
     */
    readonly id?: number;
    table_id: number;
    pending?: boolean;
    reservation_start: string;
    reservation_end: string;
}

