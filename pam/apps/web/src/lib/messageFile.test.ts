import { describe, expect, it } from 'vitest';
import { displayFileName, formatFileSize, googleLinkIn, messageFileKind, messageFileType } from './messageFile';

describe('which documents Pam takes (D-399)', () => {
  it('takes PDF and Word by type', () => {
    expect(messageFileType({ name: 'a.pdf', type: 'application/pdf' })).toBe('application/pdf');
    expect(messageFileType({ name: 'a.doc', type: 'application/msword' })).toBe('application/msword');
    expect(
      messageFileType({ name: 'a.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    ).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  it('goes by the name when a phone hands the file over with no type', () => {
    expect(messageFileType({ name: 'Resume.DOCX', type: '' })).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(messageFileType({ name: 'lease.pdf', type: 'application/octet-stream' })).toBe('application/pdf');
  });

  it('refuses everything else, whatever it is called', () => {
    expect(messageFileType({ name: 'macro.docm', type: 'application/vnd.ms-word.document.macroEnabled.12' })).toBeNull();
    expect(messageFileType({ name: 'notes.txt', type: 'text/plain' })).toBeNull();
    expect(messageFileType({ name: 'run.exe', type: '' })).toBeNull();
    // A name that claims to be a PDF does not beat a type that says otherwise.
    expect(messageFileType({ name: 'fake.pdf', type: 'text/html' })).toBeNull();
  });

  it('tells a PDF from a Word file by its name', () => {
    expect(messageFileKind('Lease 2026.PDF')).toBe('pdf');
    expect(messageFileKind('resume.docx')).toBe('word');
  });
});

describe('what a document shows before it is opened', () => {
  it('says its size the way people say it', () => {
    expect(formatFileSize(245_760, 'en')).toBe('240 kB');
    expect(formatFileSize(1_258_291, 'en')).toBe('1.2 MB');
    expect(formatFileSize(10, 'en')).toBe('1 kB');
  });

  it('shows a name, never a path or a hidden character', () => {
    expect(displayFileName('C:\\Users\\me\\Lease.pdf')).toBe('Lease.pdf');
    expect(displayFileName('../../etc/passwd')).toBe('passwd');
    expect(displayFileName('a\u0000b\u001f.pdf')).toBe('ab.pdf');
    expect(displayFileName('x'.repeat(300))).toHaveLength(200);
  });
});

describe('a Google Doc is a link (D-399)', () => {
  it('finds a Docs, Sheets, Slides, Forms or Drive link in a message', () => {
    expect(googleLinkIn('Here: https://docs.google.com/document/d/abc/edit thanks')).toEqual({
      url: 'https://docs.google.com/document/d/abc/edit',
      kind: 'doc',
    });
    expect(googleLinkIn('https://docs.google.com/spreadsheets/d/x/edit#gid=0')?.kind).toBe('sheet');
    expect(googleLinkIn('https://docs.google.com/presentation/d/x')?.kind).toBe('slides');
    expect(googleLinkIn('https://docs.google.com/forms/d/x/viewform')?.kind).toBe('form');
    expect(googleLinkIn('https://drive.google.com/file/d/x/view')?.kind).toBe('drive');
  });

  it('leaves the full stop at the end of a sentence out of the link', () => {
    expect(googleLinkIn('See https://docs.google.com/document/d/abc.')?.url).toBe(
      'https://docs.google.com/document/d/abc',
    );
  });

  it('is only ever Google, over https', () => {
    expect(googleLinkIn('https://docs.google.com.evil.example/document/d/x')).toBeNull();
    expect(googleLinkIn('http://docs.google.com/document/d/x')).toBeNull();
    expect(googleLinkIn('https://evil.example/?u=https//docs.google.com/document')).toBeNull();
    expect(googleLinkIn('no link here')).toBeNull();
    expect(googleLinkIn(null)).toBeNull();
  });
});
