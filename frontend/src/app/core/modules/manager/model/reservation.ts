/**
 * Manager API
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface Reservation { 
    /**
     * ID of the Reservation
     */
    readonly id?: number;
    /**
     * IDs of the table to reserve
     */
    table_ids: Array<number>;
    /**
     * Start time of the reservation
     */
    reservation_start: string;
    /**
     * End time of the reservation
     */
    reservation_end: string;
    /**
     * Whether the reservation is pending (optional)
     */
    pending?: boolean;
}

