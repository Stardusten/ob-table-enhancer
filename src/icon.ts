import TableEnhancer2 from "../main";
import {addIcon} from "obsidian";

export const insertBelowIcon = `
<svg
	t="1661842034318"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="5688"
	width="16"
	height="16"
>
	<path
		d="M904 768H120c-4.4 0-8 3.6-8 8v80c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-80c0-4.4-3.6-8-8-8zM878.7 160H145.3c-18.4 0-33.3 14.3-33.3 32v464c0 17.7 14.9 32 33.3 32h733.3c18.4 0 33.3-14.3 33.3-32V192c0.1-17.7-14.8-32-33.2-32zM360 616H184V456h176v160z m0-224H184V232h176v160z m240 224H424V456h176v160z m0-224H424V232h176v160z m240 224H664V456h176v160z m0-224H664V232h176v160z" 
		p-id="5689"
		fill="currentColor"
	    stroke="currentColor"
	></path>
</svg>`;

export const deleteIcon = `
<svg
	t="1661781161180"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="3242"
	width="16"
	height="16"
>
	<path
		d="M512 471.744l207.424-207.36a28.416 28.416 0 1 1 40.256 40.192L552.256 512l207.36 207.424a28.416 28.416 0 1 1-40.192 40.256L512 552.256l-207.424 207.36a28.416 28.416 0 1 1-40.256-40.192L471.744 512l-207.36-207.424a28.416 28.416 0 0 1 40.192-40.256L512 471.744z"
		p-id="3243"
		fill="currentColor"
	    stroke="currentColor"
	>
	</path>
</svg>`;

export const insertRightIcon = `
<svg
	t="1661842059940"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="5924"
	width="16"
	height="16"
>
	<path
		d="M856 112h-80c-4.4 0-8 3.6-8 8v784c0 4.4 3.6 8 8 8h80c4.4 0 8-3.6 8-8V120c0-4.4-3.6-8-8-8zM656 112H192c-17.7 0-32 14.9-32 33.3v733.3c0 18.4 14.3 33.3 32 33.3h464c17.7 0 32-14.9 32-33.3V145.3c0-18.4-14.3-33.3-32-33.3zM392 840H232V664h160v176z m0-240H232V424h160v176z m0-240H232V184h160v176z m224 480H456V664h160v176z m0-240H456V424h160v176z m0-240H456V184h160v176z" 
		p-id="5925"
		fill="currentColor"
	    stroke="currentColor"
	></path>
</svg>`;

export const centerAlignedIcon = `
<svg 
	t="1661840940089"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="1722"
	width="16"
	height="16"
>
	<path
	d="M170.666667 224h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM298.666667 394.666667h426.666666a32 32 0 1 1 0 64H298.666667a32 32 0 1 1 0-64zM170.666667 565.333333h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM298.666667 736h426.666666a32 32 0 1 1 0 64H298.666667a32 32 0 1 1 0-64z"
	fill="currentColor"
    stroke="currentColor"
	p-id="1723"
	>
	</path>
</svg>`;

export const leftAlignedIcon = `
<svg 
	t="1661841114814"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="4223" width="16" height="16"
>
	<path
		d="M170.666667 224h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM170.666667 394.666667h426.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM170.666667 565.333333h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM170.666667 736h426.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64z"
		fill="currentColor"
    	stroke="currentColor"
		p-id="4224"
	></path>
</svg>
`;

export const rightAlignedIcon = `
<svg
	t="1661841218626"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="4438"
	width="16"
	height="16"
>
	<path
		d="M170.666667 224h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM426.666667 394.666667h426.666666a32 32 0 1 1 0 64H426.666667a32 32 0 1 1 0-64zM170.666667 565.333333h682.666666a32 32 0 1 1 0 64H170.666667a32 32 0 1 1 0-64zM426.666667 736h426.666666a32 32 0 1 1 0 64H426.666667a32 32 0 1 1 0-64z"
		fill="currentColor"
    	stroke="currentColor"
		p-id="4439"
	></path>
</svg>
`;

export const moveRightIcon = `
<svg
	t="1662187765148"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="9678"
	width="16"
	height="16"
>
	<path
		d="M593.450667 512.128L360.064 278.613333l45.290667-45.226666 278.613333 278.762666L405.333333 790.613333l-45.226666-45.269333z" 
		p-id="9679"
		fill="currentColor"
    	stroke="currentColor"
	></path>
</svg>`;

export const moveLeftIcon = `
<svg
	t="1662188090144"
	class="icon"
	viewBox="0 0 1024 1024"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	p-id="6067"
	width="16"
	height="16"
>
	<path
		d="M641.28 278.613333l-45.226667-45.226666-278.634666 278.762666 278.613333 278.485334 45.248-45.269334-233.365333-233.237333z"
		p-id="6068"
		fill="currentColor"
    	stroke="currentColor"
	></path>
</svg>`;

export const cloneIcon = `
<svg t="1671932954709" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4984" width="16" height="16"><path d="M160 160v544h128v-64H224V224h416v64h64V160H160z m160 160v544h544V320H320z m64 64h416v416H384V384z" fill="currentColor"
    	stroke="currentColor" p-id="4985"></path></svg>`;

export const widerIcon = `
<svg
   width="15.999999"
   height="15.999999"
   viewBox="0 0 4.233333 4.233333"
   id="svg5"
   xmlns="http://www.w3.org/2000/svg">
  <defs
     id="defs2" />
  <g
     id="layer1">
    <path
       id="path240-5-3"
       fill="currentColor"
	   stroke="currentColor"
       style="stroke-width:0.15531;stroke-linecap:round;stroke-dasharray:none"
       d="M 2.7169851,2.8149426 3.3554478,2.1166667 M 2.7169851,1.4183908 3.3554478,2.1166667 M 1.5163481,2.8149426 0.8778855,2.1166667 M 1.5163481,1.4183908 0.8778855,2.1166667" />
  </g>
</svg>`;

export const narrowerIcon = `
<svg
   width="15.999999"
   height="15.999999"
   viewBox="0 0 4.233333 4.233333"
   id="svg5"
   xmlns="http://www.w3.org/2000/svg">
  <defs
     id="defs2" />
  <g
     id="layer1">
    <path
       id="path240-5-3"
       fill="currentColor"
	   stroke="currentColor"
       style="stroke-width:0.15531;stroke-linecap:round;stroke-dasharray:none"
       d="M 3.2871706,2.8149426 2.6487079,2.1166667 M 3.2871706,1.4183908 2.6487079,2.1166667 M 0.94616277,2.8149426 1.5846254,2.1166667 M 0.94616277,1.4183908 1.5846254,2.1166667" />
  </g>
</svg>`;

export const upwardIcon = `
<svg t="1671934713104" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2640" width="16" height="16"><path d="M830.24 685.76l11.328-11.312a16 16 0 0 0 0-22.64L530.448 340.688a16 16 0 0 0-22.64 0L196.688 651.808a16 16 0 0 0 0 22.64l11.312 11.312a16 16 0 0 0 22.624 0l288.496-288.512L807.632 685.76a16 16 0 0 0 22.624 0z" fill="currentColor"
	   stroke="currentColor" p-id="2641"></path></svg>`;

export const downIcon = `
<svg t="1671934792670" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3163" width="16" height="16"><path d="M830.24 340.688l11.328 11.312a16 16 0 0 1 0 22.624L530.448 685.76a16 16 0 0 1-22.64 0L196.688 374.624a16 16 0 0 1 0-22.624l11.312-11.312a16 16 0 0 1 22.624 0l288.496 288.496 288.512-288.496a16 16 0 0 1 22.624 0z" fill="currentColor"
	   stroke="currentColor" p-id="3164"></path></svg>`;

export const insertColRight = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
    <path d="M6,5C5.448,5 5,5.448 5,6L5,18C5,18.552 5.448,19 6,19L12,19C12.552,19 13,18.552 13,18L13,6C13,5.448 12.552,5 12,5L6,5Z"/>
    <path d="M19,19L19,5"/>
</svg>`;

export const insertRowBelow = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
    <path d="M19,6C19,5.448 18.552,5 18,5L6,5C5.448,5 5,5.448 5,6L5,12C5,12.552 5.448,13 6,13L18,13C18.552,13 19,12.552 19,12L19,6Z"/>
    <path d="M5,19L19,19"/>
</svg>`;

export const cloneRow = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
    <path d="M19,6L5,6"/>
    <path d="M7,19L5,19"/>
    <path d="M13,19L11,19"/>
    <path d="M19,19L17,19"/>
    <path d="M12,14L15,11"/>
    <path d="M12,14L9,11"/>
</svg>`;

export const cloneCol = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
    <path d="M6,5L6,19"/>
    <path d="M19,17L19,19"/>
    <path d="M19,11L19,13"/>
    <path d="M19,5L19,7"/>
    <path d="M14,12L11,9"/>
    <path d="M14,12L11,15"/>
</svg>`;

export const delRow = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
    <path d="M17.75,5L4,5"/>
    <path d="M17.75,19L4,19"/>
    <path d="M12,12L4,12"/>
    <path d="M15,14.5L20,9.5"/>
    <path d="M20,14.5L15,9.5"/>
</svg>`;

export const delCol = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
    <path d="M5,6.25L5,20"/>
    <path d="M19,6.25L19,20"/>
    <path d="M12,12L12,20"/>
    <path d="M14.5,9L9.5,4"/>
    <path d="M14.5,4L9.5,9"/>
</svg>`;
