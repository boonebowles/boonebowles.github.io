/*
TITLE:			Get 10-K Filing Dates (code = SAS; output = DATA)
AUTHOR:			Boone Bowles
DATE:			September 25, 2023
LANGUAGE:		SAS
OUTPUT:			Data file

Description:	This program signs in to the WRDS database, connects to a remote
				library, (/wrds/comp/sasdata/naa/company) and then obtains the
				filing dates for 10K and 10Q filings over a given period.
				
				This program runs in about two minutes.
*/

/*	Sign in to WRDS	*/
%LET wrds = wrds-cloud.wharton.upenn.edu 4016;
OPTIONS comamid=TCP remote=WRDS;
SIGNON username=_prompt_;

/*	Set data library in WRDS	*/
LIBNAME comp remote '/wrds/comp/sasdata/naa/company' server=wrds;/*	Library with COMPUSTAT filing data				*/

/*	Read in the company filing data from COMPUSTAT	*/
PROC SQL;
	CREATE TABLE comp AS
	SELECT DISTINCT
					a.gvkey,
					a.srctype,
					a.filedatetime,
					a.datadate,
					a.filedate
	FROM			comp.co_filedate as a
	WHERE			year(a.datadate) >= 1994 and
					year(a.datadate) <= 2020 and
					a.srctype in ("10K","10Q")
	ORDER BY		a.gvkey,a.datadate;
QUIT;