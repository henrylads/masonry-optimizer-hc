## **Fixing Position Optimisation**

### **Purpose**

In some designs, particularly with very thick slabs, it is desirable to position the cast-in channel deeper in the slab. This avoids the need for oversized brackets. 

Additional note: Start at 75mm the drop down in 5mm increments. And the minimum minimum bracket height is 95mm to the fixing point/rise to bolt and Critical Edge Distance can't be below 75m to bottom of the slab

* **Left image (traditional case):** The slab thickness input defines both the calculation and the 3D geometry. By default, the fixing point is assumed to be **75 mm down from the top of the slab**.  
* **Right image (with extra thickness):** An additional layer of concrete is shown above the fixing zone, based on the **extra thickness** value. This visually lowers the fixing point relative to the slab top.

![][image1]![][image2]  
**User Input Changes**

* Toggle button to allow the system to move the fixing position from 75mm top of slab. On thicker slabs this should be recommended to the user.

**Calculation Rules**

* Calculations remain unchanged and should use the fixing data all based on 75mm down from top of the slab. 

**Optimisation Rules**

* **Baseline fixing position**:  
  The fixing calculation will continue to assume a fixing depth of **75 mm down from the top of the slab** as the initial position.

* **Optimisation process**:  
  Instead of stopping at 75 mm, the optimisation routine will **iterate the fixing position downward in 5 mm increments** (e.g., 75 mm, 80 mm, 85 mm, …).  
  * At each increment, the system will:  
    1. **Recalculate the rise to bolts** (reduced by 5 mm per step).  
    2. **Generate a new bracket geometry** with a reduced rise and therefore smaller bracket height.  
    3. **Re-run design checks** (shear, tension, moment, etc.) to confirm the revised fixing position is still valid.

* **Decision rule**:  
  If the governing design check is **not controlled by the rise to bolts**, moving the fixing position down may **allow a smaller bracket** to be used without compromising total weight of system.  
  * The optimiser should select the fixing position that **minimises total bracket steel usage** while still satisfying all structural verifications.

* **Expected outcome**:  
  * For thicker slabs (e.g., 350 mm), the system will avoid defaulting to an unnecessarily tall bracket.  
  * By progressively lowering the fixing point, the optimiser can identify a **more material-efficient solution** that reduces steel consumption without affecting structural performance.

![][image3]

**3D Model Rules**

* The parameter sent to ShapeDiver will need to be the actual fixing position to make sure the bracket is placed in the correct position. 

## **Load Position and Thickness**

## **Load Position**

The **load position** defines where the vertical load from the masonry/precast/stone is assumed to act relative to the supporting angle.

* **Default assumptions**:  
  * For **brickwork**, the load is assumed to act at **⅓ of the bearing length** from the inner face of brick.  
  * For **precast or stone**, the load is assumed to act at **½ of the bearing length** (i.e., mid-point of the supported unit).

![][image4]![][image5]

This convention reflects typical stress distribution for each material.

**Impact on the e-value (eccentricity) calculation**

The eccentricity e is calculated as:

***e \= facade\_thickness\*load\_position***

Where:

* facade\_thickness \= thickness of the facade (for brick this is set to 102.5mm as standard)  
* Load\_position \=  fraction of how the load is applied.

With **⅓ bearing for brick**:

e \= 102.5\*⅓ 

With **½ bearing** for precast/stone

e \= 250\*½ 

**User control**

* The tool **automatically sets** the load position based on the substrate:  
  * **Brick** → ⅓ bearing  
  * **Precast/Stone** → ½ bearing

* Users can **override this assumption** by selecting a position between **0 and 1**:  
  * **0** \= load applied at the **back** of the façade unit  
    **1** \= load applied at the **front** of the façade unit

If the user prefers, the tool can calculate this value for them. For example:

* Façade thickness \= 250 mm  
* Desired offset \= 50 mm from the back  
* Load position \= 50/250 \= 0.2

This approach ensures flexibility: the tool provides sensible defaults, but users can either override directly with a 0–1 input or calculate the fraction from an absolute dimension.

This flexibility allows fine-tuning for atypical detailing or manufacturer-specific requirements.

## **Angle Projection**

Provide a clear, robust method to recalculate the angle projection whenever the user changes the façade thickness or any related geometry, ensuring bearing is adequate and downstream checks remain valid.

The formula to calculate this would be:

***raw \=  ⅔ \* facade\_thickness \+ cavity \- (bracket\_projection \+ isolation\_shim\_thickness) \+ front\_offset***

Where:

- facade\_thickness: Total thickness of the façade unit (e.g., facing brick 102.5). This can either come when the user selects on the I dont know load section or we need to have another option where the user can input this field.  
- cavity: Horizontal distance from back of façade to slab face.  
- bracket\_projection: Horizontal projection of the support bracket from slab face to back of the angle.  
- isolation\_shim\_thickness: Pads/packers between bracket and angle that move the angle forward.  
- front\_offset: Allowance at the toe (e.g., drip/setback) that moves the effective bearing line forward. Default \+12 mm.

**Worked Examples**

**Inputs:**

* facade\_thickness \= 102.5  
* cavity \= 100  
* bracket\_projection \= 90  
* isolation\_shim\_thickness \= 3  
* front\_offset \= 12

**Calculation:**

raw \= 68.33 \+ 100 \- (90+3) \+ 12 \= 87.33 mm

 ![][image6]  
**Inputs:**

* facade\_thickness \= 250  
* cavity \= 100  
* bracket\_projection \= 90  
* isolation\_shim\_thickness \= 0  
* front\_offset \= 12

**Calculation:**

raw \= 166.67 \+ 100 \- 90 \+ 12 \= 188.6 mm

![][image7]  
Always round up to the nearest 5mm increment in projection

## **Angle Height Changes**

In some cases, the bracket cannot be extended downwards (or upwards, for inverted brackets) because it would clash with SFS or other building structure. However, the required support height must still be achieved. To resolve this, the angle height can be extended instead of the bracket.

* **Left-hand image:** Standard approach – the bracket itself is extended to reach the support level.  
* **Right-hand image:** Angle height is extended downwards to achieve the same support level while keeping the bracket compact.

This logic applies to both **standard** and **inverted** brackets.

### **Exclusion Zone & Angle Extension Logic**

In some cases, the bracket cannot extend fully below the slab because it would clash with other building elements (e.g., SFS). To resolve this, the user can define a **maximum allowable bracket extension**. Any additional depth required to reach the support level will then be provided by extending the **angle height** instead of the bracket.

If a clash still occurs, the user can enable a **notch** to locally cut the bracket around the excluded area.

This logic will be carried over for inverted brackets but the maximum allowable bracket extension will be positive. 

**![][image8]**

**User Inputs**

* **Notch**: on/off  
* **Notch height (mm)**  
* **Notch width (mm)**  
* **Max allowable bracket extension (mm)**  
  * Defined relative to the top of the slab (similar to support height).  
  * Sets the maximum depth the bracket is allowed to project below the slab.  
  * If the support height is deeper than this limit, the difference is made up by extending the angle downward.

**Example**

* **Slab thickness:** 225 mm  
* **Support height:** −350 mm (125 mm below slab soffit)  
* **Max allowable bracket extension:** −300 mm

Result:

* The bracket is restricted to project only 300 mm below slab.  
* Since support is at 350 mm, the bracket must be **50 mm shorter** than normal.  
* The **angle height** is extended by 50 mm to make up the difference.

**Calculation Adjustments**

* All existing calculation methods remain unchanged.  
* Adjustments are applied only to the **geometry**:  
  * Bracket height may be reduced by the extension restriction.  
  * Angle height is increased to compensate where needed.  
* After geometry is updated, all **structural checks** (bracket, angle, fixings, channel) proceed as normal using the revised dimensions.
