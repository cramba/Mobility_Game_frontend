/** 
 * author: Sean Dittmann
 * date: 11.11.2022
 * 
 * ListElement - List Element of streetplaner list for streetplaner objects (like sraight, cross or curve object).
 * groupId - categoryId for the list like street or railway (useful Id system needs to be invented later)
 * group - text for category like street or railway
 * id - Id of this object (useful Id system needs to be invented later)
 * type - fill text, maybe useful later or should be deleted later
 * name - name of the object which is displayed in the list
 * heading - preperation for rotation task, shows the heading 0(default) - 90 - 180 - 270 - 0
 * texture - path for the displayed picture
 */

export interface IListElement {
    groupId: number,
    group: string,
    id: number,
    type: string,
    name: string,
    heading: number,
    texture: string
}